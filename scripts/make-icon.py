#!/usr/bin/env python3
"""生成插件市场用的图标位图。

awesome-dsh-plugin 只接受 **GitHub 托管的位图**（png/jpg/webp），SVG 会被拒绝；
所以这里把产品标记渲染成 PNG 随仓库一起提交，而不是丢给第三方图床。

造型与起笔桌面版 exe 的图标同源：深红圆角底 + 一支斜向毛笔 + 一笔墨迹。
底色 #e60012 是起笔自己的封面主色。

产物：
  assets/icon-180.png   市场卡片图标（约 96px 显示，方形最清楚）
  assets/icon.png       512 主图，供 README / 商店页使用

用法：python scripts/make-icon.py
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
SS = 4
DS = SIZE * SS

BRAND_TOP = (255, 64, 74)
BRAND_MID = (230, 0, 18)
BRAND_BOTTOM = (150, 0, 12)
INK = (255, 252, 250, 240)
BRUSH = (255, 255, 255, 255)

OUT_DIR = Path(__file__).resolve().parent.parent / "assets"


def tapered_polygon(points, widths):
    left, right = [], []
    count = len(points)
    for index, (x, y) in enumerate(points):
        if index == 0:
            tx, ty = points[1][0] - x, points[1][1] - y
        elif index == count - 1:
            tx, ty = x - points[count - 2][0], y - points[count - 2][1]
        else:
            tx, ty = points[index + 1][0] - points[index - 1][0], points[index + 1][1] - points[index - 1][1]
        length = math.hypot(tx, ty) or 1.0
        nx, ny = -ty / length, tx / length
        half = widths[index] / 2.0
        left.append((x + nx * half, y + ny * half))
        right.append((x - nx * half, y - ny * half))
    return left + right[::-1]


def bezier_points(p0, p1, p2, steps=72):
    out = []
    for i in range(steps + 1):
        t = i / steps
        u = 1.0 - t
        out.append((
            u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
            u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
        ))
    return out


def draw_glyph():
    layer = Image.new("RGBA", (DS, DS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    def pt(x, y):
        return (x * DS, y * DS)

    def w(value):
        return value * DS

    shaft = bezier_points(pt(0.800, 0.196), pt(0.632, 0.330), pt(0.352, 0.606))
    count = len(shaft)
    widths = []
    for index in range(count):
        t = index / (count - 1)
        if t < 0.44:
            widths.append(w(0.116) * (1.0 - 0.08 * (t / 0.44)))
        else:
            u = (t - 0.44) / 0.56
            widths.append(w(0.107) * (1.0 - u) ** 1.22 + w(0.0018))
    draw.polygon(tapered_polygon(shaft, widths), fill=BRUSH)

    r = w(0.116) / 2
    cx, cy = pt(0.800, 0.196)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BRUSH)

    ink = bezier_points(pt(0.336, 0.712), pt(0.528, 0.848), pt(0.792, 0.690))
    ink_count = len(ink)
    ink_widths = [w(0.086) * (1.0 - 0.982 * (i / (ink_count - 1)) ** 0.72) for i in range(ink_count)]
    draw.polygon(tapered_polygon(ink, ink_widths), fill=INK)

    r = w(0.086) / 2
    cx, cy = pt(0.336, 0.712)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=INK)

    return layer


def gradient_canvas(size):
    ys, xs = np.mgrid[0:size, 0:size].astype(np.float32) / float(size - 1)
    t = np.clip(xs * 0.62 + ys * 0.38, 0.0, 1.0)
    top = np.array(BRAND_TOP, dtype=np.float32)
    mid = np.array(BRAND_MID, dtype=np.float32)
    bottom = np.array(BRAND_BOTTOM, dtype=np.float32)
    first = top + (mid - top) * (t / 0.55)[..., None]
    second = mid + (bottom - mid) * ((t - 0.55) / 0.45)[..., None]
    rgb = np.where((t <= 0.55)[..., None], first, second)
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB")


def build_master():
    base = gradient_canvas(SIZE).resize((DS, DS), Image.BILINEAR)
    canvas = base.convert("RGBA")

    sheen = Image.new("RGBA", (DS, DS), (0, 0, 0, 0))
    ImageDraw.Draw(sheen).ellipse(
        [int(-0.35 * DS), int(-0.62 * DS), int(1.05 * DS), int(0.62 * DS)],
        fill=(255, 255, 255, 26),
    )
    canvas = Image.alpha_composite(canvas, sheen.filter(ImageFilter.GaussianBlur(DS * 0.02)))

    canvas = Image.alpha_composite(canvas, draw_glyph())

    mask = Image.new("L", (DS, DS), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, DS - 1, DS - 1], radius=int(DS * 0.225), fill=255)
    canvas.putalpha(mask)
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    master = build_master()
    for name, size in (("icon-180.png", 180), ("icon.png", 512)):
        path = OUT_DIR / name
        master.resize((size, size), Image.LANCZOS).save(path, format="PNG", optimize=True)
        print(f"[icon] {path}  {size}x{size}")


if __name__ == "__main__":
    main()
