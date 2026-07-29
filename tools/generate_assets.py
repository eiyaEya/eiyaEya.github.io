from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

RED = "#ff2442"
RED_DEEP = "#d71936"
RED_SOFT = "#fff0f2"
INK = "#151515"
MUTED = "#73737a"
LINE = "#e9e9ee"
WHITE = "#ffffff"
WASH = "#f7f7f9"
GREEN = "#15a36c"
AMBER = "#f2a93b"
BLUE = "#2f80ed"


def font(size, bold=False):
    candidates = [
        "C:/Windows/Fonts/msyhbd.ttc" if bold else "C:/Windows/Fonts/msyh.ttc",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


def canvas(size, bg=WHITE):
    return Image.new("RGB", size, bg)


def rounded(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text_center(draw, xy, text, fill, size, bold=False):
    fnt = font(size, bold)
    box = draw.textbbox((0, 0), text, font=fnt)
    x = xy[0] - (box[2] - box[0]) / 2
    y = xy[1] - (box[3] - box[1]) / 2
    draw.text((x, y), text, fill=fill, font=fnt)


def add_note_card(draw, x, y, w, h, title, accent=RED):
    rounded(draw, (x, y, x + w, y + h), 18, WHITE, LINE, 2)
    rounded(draw, (x + 20, y + 22, x + w - 20, y + 110), 14, "#fafafa")
    rounded(draw, (x + 36, y + 38, x + 112, y + 92), 14, accent)
    draw.line((x + 132, y + 48, x + w - 44, y + 48), fill=INK, width=7)
    draw.line((x + 132, y + 72, x + w - 74, y + 72), fill=MUTED, width=5)
    draw.line((x + 28, y + 138, x + w - 35, y + 138), fill=INK, width=6)
    draw.line((x + 28, y + 164, x + w - 74, y + 164), fill=MUTED, width=5)
    draw.text((x + 28, y + h - 50), title, fill=accent, font=font(28, True))


def avatar():
    img = canvas((512, 512), RED_SOFT)
    d = ImageDraw.Draw(img)
    rounded(d, (18, 18, 494, 494), 96, WHITE)
    rounded(d, (70, 70, 442, 442), 88, RED)
    d.ellipse((146, 112, 366, 332), fill="#ffd9df")
    d.arc((150, 174, 362, 406), 20, 160, fill=WHITE, width=22)
    text_center(d, (256, 260), "SR", WHITE, 116, True)
    img.save(ASSETS / "avatar.png", quality=95)


def phone_feed(path, title, accent=RED):
    img = canvas((900, 1125), WASH)
    d = ImageDraw.Draw(img)
    rounded(d, (150, 60, 750, 1065), 56, WHITE, "#dedee5", 5)
    rounded(d, (184, 112, 716, 1016), 34, WHITE)
    d.line((218, 178, 682, 178), fill=LINE, width=4)
    text_center(d, (450, 148), "Ruiquan", INK, 34, True)
    add_note_card(d, 214, 220, 220, 310, "Like", accent)
    add_note_card(d, 466, 220, 220, 390, "Note", BLUE)
    add_note_card(d, 214, 560, 220, 360, "Work", GREEN)
    add_note_card(d, 466, 640, 220, 280, "Life", AMBER)
    rounded(d, (270, 956, 630, 994), 19, RED)
    text_center(d, (450, 973), title, WHITE, 23, True)
    img.save(ASSETS / path, quality=92)


def project_board(path, title, accent=RED):
    img = canvas((1200, 750), WHITE)
    d = ImageDraw.Draw(img)
    rounded(d, (44, 44, 1156, 706), 26, "#fafafa", LINE, 2)
    rounded(d, (90, 96, 1110, 212), 22, RED_SOFT)
    text_center(d, (600, 154), title, RED_DEEP, 46, True)
    for i, color in enumerate([accent, GREEN, BLUE]):
        x = 102 + i * 344
        rounded(d, (x, 268, x + 300, 596), 22, WHITE, LINE, 3)
        rounded(d, (x + 28, 304, x + 272, 414), 18, color)
        d.line((x + 36, 456, x + 260, 456), fill=INK, width=9)
        d.line((x + 36, 492, x + 232, 492), fill=MUTED, width=7)
        rounded(d, (x + 36, 532, x + 152, 572), 18, RED_SOFT)
        d.text((x + 62, 538), "OPEN" if i < 2 else "NOTE", fill=RED_DEEP, font=font(22, True))
    img.save(ASSETS / path, quality=92)


def notebook(path, title, accent=RED):
    img = canvas((1200, 750), "#fbfbfc")
    d = ImageDraw.Draw(img)
    rounded(d, (100, 86, 1100, 650), 26, WHITE, LINE, 3)
    d.line((220, 86, 220, 650), fill=RED_SOFT, width=8)
    for y in range(170, 590, 70):
        d.line((278, y, 1000, y), fill=LINE, width=4)
    rounded(d, (784, 166, 1008, 368), 24, accent)
    rounded(d, (802, 386, 990, 434), 14, RED_SOFT)
    text_center(d, (896, 410), "BLOG", RED_DEEP, 26, True)
    d.text((282, 186), title, fill=INK, font=font(46, True))
    d.text((282, 268), "life / work / notes", fill=MUTED, font=font(30))
    d.arc((302, 402, 620, 562), 10, 170, fill=RED, width=12)
    img.save(ASSETS / path, quality=92)


def qr_scene(path):
    img = canvas((900, 1125), WHITE)
    d = ImageDraw.Draw(img)
    rounded(d, (108, 108, 792, 1017), 44, RED_SOFT)
    rounded(d, (190, 190, 710, 710), 28, WHITE)
    cell = 42
    pattern = [
        (0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2),
        (8, 0), (9, 0), (10, 0), (8, 1), (10, 1), (8, 2), (9, 2), (10, 2),
        (0, 8), (1, 8), (2, 8), (0, 9), (2, 9), (0, 10), (1, 10), (2, 10),
        (4, 4), (5, 4), (7, 4), (3, 6), (5, 6), (8, 6), (4, 8), (6, 9), (9, 9), (5, 10)
    ]
    for px, py in pattern:
        rounded(d, (220 + px * cell, 220 + py * cell, 220 + px * cell + 30, 220 + py * cell + 30), 7, INK)
    text_center(d, (450, 808), "Scan to visit", RED_DEEP, 46, True)
    text_center(d, (450, 878), "ruiquan.studio", MUTED, 30)
    img.save(ASSETS / path, quality=92)


def admin_scene(path):
    img = canvas((900, 1125), WHITE)
    d = ImageDraw.Draw(img)
    rounded(d, (92, 110, 808, 1015), 34, "#fafafa", LINE, 3)
    rounded(d, (150, 172, 750, 292), 20, RED)
    text_center(d, (450, 232), "DATA ADMIN", WHITE, 44, True)
    for i, label in enumerate(["profile", "projects", "blog", "contact"]):
        y = 348 + i * 132
        rounded(d, (150, y, 750, y + 88), 18, WHITE, LINE, 2)
        rounded(d, (180, y + 24, 236, y + 64), 12, RED_SOFT)
        d.text((270, y + 26), label, fill=INK, font=font(32, True))
    rounded(d, (260, 900, 640, 960), 28, RED_SOFT)
    text_center(d, (450, 930), "GitHub storage", RED_DEEP, 30, True)
    img.save(ASSETS / path, quality=92)


def style_scene(path):
    img = canvas((900, 1125), WHITE)
    d = ImageDraw.Draw(img)
    for i in range(8):
        x = 86 + (i % 2) * 370
        y = 92 + (i // 2) * 240
        h = 190 if i % 3 else 220
        rounded(d, (x, y, x + 326, y + h), 22, "#fafafa", LINE, 2)
        rounded(d, (x + 22, y + 22, x + 304, y + 104), 18, RED if i % 2 == 0 else "#222222")
        d.line((x + 22, y + 130, x + 286, y + 130), fill=INK, width=8)
        d.line((x + 22, y + 160, x + 230, y + 160), fill=MUTED, width=6)
    text_center(d, (450, 1038), "Red + White", RED_DEEP, 44, True)
    img.save(ASSETS / path, quality=92)


def main():
    avatar()
    phone_feed("feed-mobile.png", "Mobile First", RED)
    project_board("feed-project.png", "Project Status", RED)
    notebook("feed-blog.png", "Blog Notes", BLUE)
    qr_scene("feed-qr.png")
    admin_scene("feed-admin.png")
    style_scene("feed-style.png")
    project_board("project-homepage.png", "Homepage", RED)
    project_board("project-showcase.png", "Showcase", BLUE)
    notebook("project-notes.png", "Private Notes", AMBER)
    phone_feed("blog-mobile.png", "Mobile UX", RED)
    project_board("blog-github.png", "GitHub Pages", INK)
    notebook("blog-life.png", "Life Notes", GREEN)


if __name__ == "__main__":
    main()
