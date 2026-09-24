"""Build the coherent raster asset kit used by the pilot map region.

The source artwork is deliberately rendered at 2x and downsampled so every
sprite has a soft, painted edge while remaining lightweight in the browser.
"""

from pathlib import Path
import random

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "painted"
S = 2


def canvas(size):
    return Image.new("RGBA", (size[0] * S, size[1] * S), (0, 0, 0, 0))


def sc(points):
    return [(int(x * S), int(y * S)) for x, y in points]


def painted_surface(image, name):
    """Add restrained pigment variation without contaminating transparency."""
    seed = sum((index + 1) * ord(char) for index, char in enumerate(name))
    rng = random.Random(seed)
    alpha = image.getchannel("A")

    # Low-frequency value shifts read as overlapping brush loads rather than
    # synthetic pixel noise. Multiply keeps the original local lighting.
    grain = Image.effect_noise(image.size, 34).filter(ImageFilter.GaussianBlur(1.8 * S))
    grain = ImageEnhance.Contrast(grain).enhance(.72).point(lambda value: 205 + value // 5)
    pigment = Image.merge("RGBA", (grain, grain, grain, alpha))
    image = ImageChops.multiply(image, pigment)
    image.putalpha(alpha)

    glaze = Image.new("RGBA", image.size)
    brush = ImageDraw.Draw(glaze)
    for _ in range(max(24, image.width * image.height // 9000)):
        x, y = rng.randrange(image.width), rng.randrange(image.height)
        radius = rng.randint(2 * S, 9 * S)
        color = rng.choice(((255, 239, 181, 18), (35, 48, 38, 16), (191, 143, 73, 12)))
        brush.ellipse((x-radius*2, y-radius, x+radius*2, y+radius), fill=color)
    glaze.putalpha(ImageChops.multiply(glaze.getchannel("A"), alpha))
    return Image.alpha_composite(image, glaze.filter(ImageFilter.GaussianBlur(.55 * S)))


def finish(image, name, size=None):
    image = painted_surface(image, name)
    if size:
        image = image.resize(size, Image.Resampling.LANCZOS)
    else:
        image = image.resize((image.width // S, image.height // S), Image.Resampling.LANCZOS)
    image.save(OUT / f"{name}.webp", "WEBP", lossless=True, quality=95, method=6)


def shadow(image, ellipse, blur=8):
    layer = Image.new("RGBA", image.size)
    d = ImageDraw.Draw(layer)
    d.ellipse(tuple(int(v * S) for v in ellipse), fill=(29, 42, 27, 105))
    image.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur * S)))


def mountain(name, seed, snowy=False, wide=360, high=230):
    rng = random.Random(seed)
    im = canvas((wide, high))
    shadow(im, (25, high - 61, wide - 10, high - 19), 11)
    d = ImageDraw.Draw(im)
    peaks = []
    count = 6 if wide > 300 else 4
    for i in range(count):
        x = 42 + i * (wide - 84) / (count - 1) + rng.randint(-22, 22)
        y = rng.randint(23, 76) if i in (2, 3) else rng.randint(65, 112)
        base = rng.randint(72, 104)
        peaks.append((x, y, base))
    for x, y, base in sorted(peaks, key=lambda p: p[1], reverse=True):
        left, right, bottom = x - base, x + base * .86, high - rng.randint(25, 42)
        ridge = x + rng.randint(-10, 15)
        outline = [(left, bottom), (x - 26, y + 54), (x, y), (x + 23, y + 47), (right, bottom),
                   (x + 20, bottom + 8), (x - 33, bottom + 5)]
        d.polygon(sc(outline), fill=(66, 74, 69, 255))
        d.line(sc(outline + [outline[0]]), fill=(45, 50, 46, 255), width=3 * S, joint="curve")
        d.polygon(sc([(left + 5, bottom - 2), (x, y), (ridge, bottom + 2)]), fill=(126, 129, 112, 255))
        d.polygon(sc([(x, y), (right, bottom), (ridge, bottom + 2)]), fill=(78, 88, 84, 255))
        d.polygon(sc([(x - 9, y + 15), (x + 3, y + 4), (x + 25, y + 54),
                      (x + 10, y + 45), (x - 2, y + 59), (x - 24, y + 50)]),
                  fill=((231, 235, 223, 255) if snowy else (157, 154, 130, 255)))
        for _ in range(5):
            yy = rng.randint(int(y + 60), int(bottom - 13)); xx = rng.randint(int(left + 30), int(right - 25))
            d.line(sc([(xx, yy), (xx + rng.randint(-10, 12), yy + rng.randint(10, 22)),
                          (xx + rng.randint(-15, 13), yy + rng.randint(23, 34))]),
                   fill=(43, 53, 51, 170), width=S)
    # lichen and foothill stones
    for _ in range(24):
        x, y = rng.randint(25, wide - 25), rng.randint(high - 48, high - 25)
        d.ellipse((S*(x-7), S*(y-4), S*(x+8), S*(y+5)), fill=(67, 93, 55, rng.randint(130, 220)))
    finish(im, name)


def tree(d, x, y, h, pine, rng):
    trunk = (88, 58, 38, 255)
    d.polygon(sc([(x-4,y),(x+4,y),(x+3,y-h*.42),(x-2,y-h*.42)]), fill=trunk)
    if pine:
        for k, tone in enumerate([(24,65,43,255),(31,86,49,255),(48,108,55,255)]):
            cy = y-h*.28-k*h*.19; w = h*(.31-k*.035)
            pts=[(x,cy-h*.38),(x-w,cy+h*.12),(x-w*.45,cy+h*.09),(x-w*.72,cy+h*.27),(x+w*.72,cy+h*.27),(x+w*.42,cy+h*.08),(x+w,cy+h*.12)]
            d.polygon(sc(pts),fill=tone)
            d.line(sc(pts+[pts[0]]),fill=(18,55,39,180),width=S)
    else:
        for ox, oy, rr, col in [(-.15,-.5,.21,(48,102,49,255)),(.13,-.55,.24,(61,122,55,255)),(0,-.72,.22,(78,137,60,255)),(-.22,-.72,.17,(91,147,66,255))]:
            r=h*rr; cx=x+h*ox; cy=y+h*oy
            d.ellipse((S*(cx-r),S*(cy-r*.82),S*(cx+r),S*(cy+r*.82)),fill=col,outline=(37,81,42,210),width=2*S)


def forest(name, seed, pine=True, count=15):
    rng=random.Random(seed); im=canvas((310,190)); shadow(im,(18,145,294,180),8); d=ImageDraw.Draw(im)
    trees=[]
    for _ in range(count):
        y=rng.randint(82,169); x=rng.randint(25,285); h=rng.randint(55,102)
        trees.append((y,x,h))
    for y,x,h in sorted(trees): tree(d,x,y,h,pine if rng.random()>.25 else not pine,rng)
    # painted leaf highlights and floor gaps
    for _ in range(34):
        x,y=rng.randint(25,285),rng.randint(86,166)
        d.ellipse((S*(x-2),S*(y-1),S*(x+3),S*(y+2)),fill=(151,177,75,150))
    finish(im,name)


def city(name, color, tier, seed):
    rng=random.Random(seed); im=canvas((260,230)); shadow(im,(32,178,236,218),10); d=ImageDraw.Draw(im)
    roof={"blue":(46,91,149,255),"red":(154,55,47,255),"neutral":(111,101,73,255)}[color]
    stone=(207,184,137,255); light=(238,216,165,255); dark=(93,70,49,255)
    # village buildings behind walls
    for i in range(4+tier):
        x=48+i*(150/(3+tier))+rng.randint(-7,7); y=151-rng.randint(4,19)
        d.rectangle((S*(x-12),S*(y-28),S*(x+13),S*y),fill=stone,outline=dark,width=2*S)
        d.polygon(sc([(x-17,y-28),(x,y-47-rng.randint(0,8)),(x+18,y-28)]),fill=roof,outline=dark)
    # back towers then keep
    tower_count=2+tier
    for i in range(tower_count):
        x=43+i*(174/max(1,tower_count-1)); h=58+rng.randint(-5,20); y=179
        d.rounded_rectangle((S*(x-16),S*(y-h),S*(x+16),S*y),radius=5*S,fill=stone,outline=dark,width=3*S)
        d.polygon(sc([(x-23,y-h+1),(x,y-h-30),(x+23,y-h+1)]),fill=roof,outline=dark)
        d.rectangle((S*(x-3),S*(y-h+15),S*(x+3),S*(y-h+28)),fill=(49,70,76,255))
    keep_h=88+12*tier; kx=130
    d.rounded_rectangle((S*(kx-34),S*(179-keep_h),S*(kx+34),S*179),radius=6*S,fill=light,outline=dark,width=3*S)
    d.polygon(sc([(kx-43,179-keep_h+2),(kx,179-keep_h-39),(kx+43,179-keep_h+2)]),fill=roof,outline=dark)
    # wall, merlons, gate, masonry
    d.rounded_rectangle((S*31,S*158,S*229,S*195),radius=8*S,fill=stone,outline=dark,width=4*S)
    for x in range(37,224,22): d.rectangle((S*x,S*150,S*(x+12),S*165),fill=light,outline=dark,width=2*S)
    d.rounded_rectangle((S*116,S*166,S*145,S*198),radius=13*S,fill=(75,53,38,255),outline=dark,width=3*S)
    for _ in range(18):
        x=rng.randint(39,220); y=rng.randint(163,190)
        d.line(sc([(x,y),(x+rng.randint(4,12),y)]),fill=(142,116,81,150),width=S)
    # flag
    fy=179-keep_h-40; d.line(sc([(130,fy+5),(130,fy-29)]),fill=dark,width=3*S)
    d.polygon(sc([(130,fy-29),(163,fy-23),(149,fy-11),(130,fy-15)]),fill=roof)
    finish(im,name)


def decoration(name, kind, seed):
    rng=random.Random(seed); im=canvas((220,150)); d=ImageDraw.Draw(im); shadow(im,(24,105,196,137),6)
    if kind=="rocks":
        for _ in range(7):
            x=rng.randint(35,185); y=rng.randint(70,123); w=rng.randint(15,34); h=rng.randint(12,28)
            d.polygon(sc([(x-w,y),(x-w*.55,y-h*.72),(x,y-h),(x+w*.62,y-h*.5),(x+w,y),(x,y+5)]),fill=(102,108,96,255),outline=(57,66,61,255))
            d.polygon(sc([(x-w*.5,y-h*.68),(x,y-h),(x+2,y-3),(x-w*.75,y)]),fill=(154,151,126,210))
    elif kind=="farm":
        d.polygon(sc([(26,111),(68,40),(199,65),(159,132)]),fill=(167,126,57,255),outline=(94,78,44,255))
        for i in range(10): d.line(sc([(39+i*14,105-i*2),(78+i*13,48+i*2)]),fill=((222,187,84,255) if i%2 else (109,142,58,255)),width=6*S)
        d.rectangle((S*24,S*103,S*164,S*110),fill=(90,65,39,255))
    elif kind=="bridge":
        stone=name.endswith("stone")
        col=(155,144,113,255) if stone else (139,86,43,255)
        d.polygon(sc([(20,92),(53,53),(204,72),(175,115)]),fill=col,outline=(67,52,38,255))
        for i in range(9): d.line(sc([(45+i*17,57+i*2),(17+i*18,95+i*2)]),fill=(205,174,111,255),width=3*S)
        d.line(sc([(25,81),(185,101)]),fill=(59,44,32,255),width=5*S)
    elif kind=="ruins":
        d.rectangle((S*45,S*64,S*73,S*120),fill=(150,140,112,255),outline=(74,72,62,255),width=3*S)
        d.rectangle((S*143,S*47,S*173,S*120),fill=(142,134,108,255),outline=(74,72,62,255),width=3*S)
        d.arc((S*67,S*56,S*151,S*138),180,360,fill=(75,71,60,255),width=10*S)
        for _ in range(12):
            x=rng.randint(30,190); y=rng.randint(110,130); d.ellipse((S*(x-8),S*(y-5),S*(x+8),S*(y+5)),fill=(110,108,90,255))
    elif kind=="village":
        for x,y in [(47,105),(95,80),(145,110),(177,72)]:
            d.rectangle((S*(x-18),S*(y-29),S*(x+18),S*y),fill=(211,183,125,255),outline=(91,66,43,255),width=2*S)
            d.polygon(sc([(x-24,y-29),(x,y-52),(x+24,y-29)]),fill=(139,66,43,255),outline=(81,52,38,255))
    elif kind=="cloud":
        for x,y,r in [(58,88,31),(91,67,42),(133,73,35),(165,91,27)]:
            d.ellipse((S*(x-r),S*(y-r*.55),S*(x+r),S*(y+r*.55)),fill=(242,240,220,205))
    finish(im,name)


def army(name,color):
    im=canvas((120,130)); d=ImageDraw.Draw(im); shadow(im,(18,100,104,122),5)
    flag=(48,95,169,255) if color=="blue" else (170,55,49,255)
    for x,y in [(39,91),(61,81),(82,94)]:
        d.ellipse((S*(x-9),S*(y-35),S*(x+9),S*(y-18)),fill=(111,104,85,255),outline=(52,50,45,255),width=2*S)
        d.polygon(sc([(x-11,y-18),(x+11,y-18),(x+17,y+18),(x-15,y+18)]),fill=flag,outline=(54,51,46,255))
        d.line(sc([(x+9,y-12),(x+19,y+20)]),fill=(203,195,161,255),width=3*S)
    d.line(sc([(58,74),(58,19)]),fill=(65,48,34,255),width=4*S)
    d.polygon(sc([(60,20),(105,29),(88,52),(60,44)]),fill=flag,outline=(60,43,34,255))
    finish(im,name)


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for i in range(1,4): mountain(f"mountain_cluster_0{i}",100+i,wide=360+i*18,high=230+i*5)
    for i in range(1,3): mountain(f"snowy_mountains_0{i}",210+i,True,390,250)
    for i in range(1,4): forest(f"pine_cluster_0{i}",300+i,True,13+i*2)
    for i in range(1,3): forest(f"mixed_forest_0{i}",400+i,False,15+i*2)
    forest("small_tree_cluster_01",501,False,8)
    for color,base in [("blue",610),("red",620)]:
        for tier,label in [(1,"small"),(2,"medium"),(3,"large")]: city(f"city_{color}_{label}",color,tier,base+tier)
    city("city_neutral","neutral",2,631)
    for i in range(1,3): decoration(f"rocks_0{i}","rocks",700+i)
    decoration("ruins_01","ruins",711)
    for i in range(1,3): decoration(f"farm_0{i}","farm",720+i)
    decoration("village_01","village",731)
    decoration("bridge_wood","bridge",741); decoration("bridge_stone","bridge",742)
    decoration("cloud_01","cloud",751); decoration("cloud_02","cloud",752)
    army("army_blue","blue"); army("army_red","red")


if __name__ == "__main__":
    main()
