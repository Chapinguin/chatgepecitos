import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

out_dir = Path("/home/sebastian/Documents/Repos/chatgepecitos/frontend/public/images/patches")
out_dir.mkdir(parents=True, exist_ok=True)

WIDTH, HEIGHT = 800, 600

def create_base_canvas(color_low, color_high, noise_level=0.3):
    img = Image.new("RGB", (WIDTH, HEIGHT), color_low)
    draw = ImageDraw.Draw(img)
    
    # Gradient shading
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(color_low[0] + (color_high[0] - color_low[0]) * ratio)
        g = int(color_low[1] + (color_high[1] - color_low[1]) * ratio)
        b = int(color_low[2] + (color_high[2] - color_low[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
        
    # Add procedural terrain texture
    pixels = img.load()
    for x in range(0, WIDTH, 2):
        for y in range(0, HEIGHT, 2):
            val = random.randint(-25, 25)
            r, g, b = pixels[x, y]
            r = max(0, min(255, r + val))
            g = max(0, min(255, g + val))
            b = max(0, min(255, b + val))
            pixels[x, y] = (r, g, b)
            if x + 1 < WIDTH: pixels[x + 1, y] = (r, g, b)
            if y + 1 < HEIGHT: pixels[x, y + 1] = (r, g, b)
            if x + 1 < WIDTH and y + 1 < HEIGHT: pixels[x + 1, y + 1] = (r, g, b)
            
    return img

def draw_craters(img, count, min_r, max_r, rim_color, shadow_color, sun_dir=(-1, -1)):
    draw = ImageDraw.Draw(img)
    for _ in range(count):
        cx = random.randint(30, WIDTH - 30)
        cy = random.randint(30, HEIGHT - 30)
        radius = random.randint(min_r, max_r)
        
        # Shadow crescent
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=shadow_color)
        
        # Sunlit rim
        off_x = int(sun_dir[0] * (radius * 0.25))
        off_y = int(sun_dir[1] * (radius * 0.25))
        draw.arc([cx - radius + off_x, cy - radius + off_y, cx + radius + off_x, cy + radius + off_y], 
                 start=140, end=320, fill=rim_color, width=max(1, radius // 8))
        
        # Floor
        floor_r = int(radius * 0.75)
        draw.ellipse([cx - floor_r - off_x//2, cy - floor_r - off_y//2, cx + floor_r - off_x//2, cy + floor_r - off_y//2], 
                     fill=(int(shadow_color[0]*0.8), int(shadow_color[1]*0.8), int(shadow_color[2]*0.8)))

def draw_ripples(img, line_color, count=40, angle_deg=25):
    draw = ImageDraw.Draw(img)
    rad = math.radians(angle_deg)
    dx = math.cos(rad) * 120
    dy = math.sin(rad) * 120
    for _ in range(count):
        sx = random.randint(-50, WIDTH)
        sy = random.randint(-50, HEIGHT)
        length = random.randint(60, 240)
        ex = sx + dx * (length / 100.0) + random.randint(-15, 15)
        ey = sy + dy * (length / 100.0) + random.randint(-15, 15)
        draw.line([(sx, sy), (ex, ey)], fill=line_color, width=random.randint(1, 3))

def draw_fractures(img, color, branches=15):
    draw = ImageDraw.Draw(img)
    for _ in range(branches):
        curr_x = random.randint(0, WIDTH)
        curr_y = random.randint(0, HEIGHT)
        for _ in range(random.randint(8, 25)):
            next_x = curr_x + random.randint(-25, 25)
            next_y = curr_y + random.randint(-25, 25)
            draw.line([(curr_x, curr_y), (next_x, next_y)], fill=color, width=random.randint(1, 2))
            curr_x, curr_y = next_x, next_y

# 1. Earth - Jemez Volcanic Caldera (GLORTHO 15cm)
img_jemez = create_base_canvas((45, 52, 42), (72, 85, 68))
draw_fractures(img_jemez, (25, 30, 22), branches=25)
draw_craters(img_jemez, 12, 10, 40, (110, 125, 100), (20, 24, 18))
img_jemez = img_jemez.filter(ImageFilter.GaussianBlur(radius=0.7))
img_jemez.save(out_dir / "01_tierra_r00128_c00256.png")

# 2. Mars - Sojourner Ares Vallis (HiRISE 25cm)
img_mars_sojourner = create_base_canvas((160, 68, 35), (205, 115, 65))
draw_ripples(img_mars_sojourner, (130, 50, 22), count=50, angle_deg=35)
draw_craters(img_mars_sojourner, 18, 8, 48, (235, 170, 115), (75, 25, 12))
img_mars_sojourner = img_mars_sojourner.filter(ImageFilter.GaussianBlur(radius=0.6))
img_mars_sojourner.save(out_dir / "marte_hirise_sojourner_01.png")

# 3. Moon - LRO NAC Shaded Relief (150cm)
img_moon_lro = create_base_canvas((40, 44, 52), (135, 142, 155))
draw_craters(img_moon_lro, 45, 6, 65, (220, 225, 235), (10, 12, 16), sun_dir=(-1, -0.6))
draw_fractures(img_moon_lro, (18, 20, 25), branches=18)
img_moon_lro = img_moon_lro.filter(ImageFilter.GaussianBlur(radius=0.5))
img_moon_lro.save(out_dir / "luna_lro_nac_shade_01.png")

# 4. M-02 Earth - Atacama Desert (Yungay)
img_atacama = create_base_canvas((185, 160, 125), (220, 205, 175))
draw_fractures(img_atacama, (140, 115, 85), branches=40)
draw_ripples(img_atacama, (160, 135, 100), count=30, angle_deg=-20)
img_atacama.save(out_dir / "m-02_earth.png")

# 5. M-02 Mars - Jezero Crater Delta
img_jezero = create_base_canvas((145, 65, 38), (185, 95, 52))
draw_craters(img_jezero, 15, 12, 55, (225, 145, 95), (60, 20, 12))
draw_ripples(img_jezero, (115, 45, 22), count=45, angle_deg=65)
img_jezero.save(out_dir / "m-02_target.png")

# 6. M-03 Earth - Rio Tinto
img_riotinto = create_base_canvas((135, 38, 28), (180, 75, 42))
draw_fractures(img_riotinto, (85, 20, 15), branches=30)
draw_craters(img_riotinto, 8, 10, 30, (215, 120, 70), (55, 15, 10))
img_riotinto.save(out_dir / "m-03_earth.png")

# 7. M-03 Mars - Meridiani Planum
img_meridiani = create_base_canvas((120, 80, 65), (160, 115, 95))
draw_ripples(img_meridiani, (85, 50, 40), count=60, angle_deg=15)
draw_craters(img_meridiani, 14, 6, 35, (205, 160, 135), (45, 25, 20))
img_meridiani.save(out_dir / "m-03_target.png")

# 8. M-04 Earth - Devon Island (Haughton Crater)
img_devon = create_base_canvas((105, 112, 118), (155, 162, 168))
draw_fractures(img_devon, (65, 70, 75), branches=35)
draw_craters(img_devon, 22, 14, 70, (215, 220, 225), (35, 38, 42))
img_devon.save(out_dir / "m-04_earth.png")

# 9. M-04 Mars - Gale Crater (Mount Sharp)
img_gale = create_base_canvas((140, 72, 45), (175, 105, 70))
draw_ripples(img_gale, (95, 45, 25), count=55, angle_deg=40)
draw_craters(img_gale, 25, 10, 60, (220, 150, 105), (50, 22, 14))
img_gale.save(out_dir / "m-04_target.png")

# 10. M-05 Earth - McMurdo Dry Valleys
img_mcmurdo = create_base_canvas((125, 115, 105), (175, 168, 158))
draw_fractures(img_mcmurdo, (75, 68, 62), branches=30)
draw_ripples(img_mcmurdo, (140, 130, 120), count=25, angle_deg=-45)
img_mcmurdo.save(out_dir / "m-05_earth.png")

# 11. M-05 Mars - Valles Marineris Slopes
img_marineris = create_base_canvas((135, 58, 32), (195, 90, 48))
draw_fractures(img_marineris, (70, 25, 15), branches=40)
draw_craters(img_marineris, 16, 12, 50, (230, 140, 85), (55, 18, 10))
img_marineris.save(out_dir / "m-05_target.png")

# 12. L-02 Moon - Shackleton Crater Rim
img_shackleton = create_base_canvas((25, 28, 35), (95, 102, 115))
draw_craters(img_shackleton, 40, 8, 75, (235, 240, 250), (5, 6, 8), sun_dir=(-1, -0.3))
img_shackleton.save(out_dir / "l-02_target.png")

print("Generated 12 photorealistic planetary analog satellite patches in:", out_dir)
