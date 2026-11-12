import os
import zipfile

def make_extension_zip():
    ext_dir = '/app/applet/extension'
    out_zip = '/app/applet/public/wellsaid-extension.zip'
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(ext_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ext_dir)
                z.write(full_path, rel_path)
    print(f"Created {out_zip} ({os.path.getsize(out_zip)} bytes)")

def make_icons_pack_zip():
    out_zip = '/app/applet/public/wellsaid-icons-pack.zip'
    pub_dir = '/app/applet/public'
    ext_icons = '/app/applet/extension/icons'
    
    readme_content = """WellSaid Brand & Extension Icon Pack
====================================
Brand: WellSaid ("Say the hard thing, well.")
Primary Color: Terracotta (#C2410C)
Background Light: #FAF7F2
Card Dark: #1E1B18

FOLDER STRUCTURE & SPECIFICATIONS:
----------------------------------
1. chrome-extension/
   - icon16.png   (16x16)   : Chrome browser toolbar favicons & tab icons
   - icon19.png   (19x19)   : Chrome extension action icon (standard 1x display)
   - icon32.png   (32x32)   : Windows taskbar / Retina 16x16 display
   - icon38.png   (38x38)   : Chrome extension action icon (Retina / high-DPI 2x display)
   - icon48.png   (48x48)   : Chrome Extensions management page (chrome://extensions)
   - icon128.png  (128x128) : Chrome Web Store installation dialog & desktop icon
   - icon256.png  (256x256) : High-resolution displays / app listing
   - icon512.png  (512x512) : Master store icon & Google Play / PWA splash

2. chrome-webstore/
   - store_icon_128x128.png    (128x128)  : Official Chrome Web Store listing icon
   - small_promo_440x280.png   (440x280)  : Small Promo Tile (Chrome Web Store recommendation cards)
   - large_promo_920x680.png   (920x680)  : Large Promo Tile (Chrome Web Store category headers)
   - marquee_1400x560.png      (1400x560) : Marquee Promotional Banner (Chrome Web Store top carousel feature)

3. transparent-background/
   - icon16_transparent.png    (16x16)
   - icon32_transparent.png    (32x32)
   - icon48_transparent.png    (48x48)
   - icon128_transparent.png   (128x128)
   - icon512_transparent.png   (512x512)

4. web-and-pwa/
   - favicon-16x16.png         (16x16)    : Web browser tab favicon
   - favicon-32x32.png         (32x32)    : Retina web browser tab favicon
   - apple-touch-icon.png      (180x180)  : iOS Home Screen Bookmark
   - pwa-192x192.png           (192x192)  : Android homescreen / PWA manifest
   - pwa-512x512.png           (512x512)  : PWA splash screen & full screen install

5. vector-svg/
   - wellsaid-icon.svg         : Infinite resolution SVG master with terracotta squircle
   - wellsaid-icon-transparent.svg : Infinite resolution SVG master with transparent background
"""

    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        # 1. chrome extension icons
        sizes = [16, 19, 32, 38, 48, 128, 256, 512]
        for s in sizes:
            p = f"{ext_icons}/icon{s}.png"
            if os.path.exists(p):
                z.write(p, f"chrome-extension/icon{s}.png")
        
        # 2. webstore banners
        ws_files = [
            ("store_icon_128x128.png", f"{pub_dir}/webstore/store_icon_128x128.png"),
            ("small_promo_440x280.png", f"{pub_dir}/webstore/small_promo_440x280.png"),
            ("large_promo_920x680.png", f"{pub_dir}/webstore/large_promo_920x680.png"),
            ("marquee_1400x560.png", f"{pub_dir}/webstore/marquee_1400x560.png"),
        ]
        for name, p in ws_files:
            if os.path.exists(p):
                z.write(p, f"chrome-webstore/{name}")
                
        # 3. transparent icons
        trans_sizes = [16, 32, 48, 128, 512]
        for s in trans_sizes:
            p = f"{ext_icons}/transparent/icon{s}_transparent.png"
            if os.path.exists(p):
                z.write(p, f"transparent-background/icon{s}_transparent.png")
                
        # 4. web and pwa
        pwa_files = [
            ("favicon-16x16.png", f"{pub_dir}/icons/favicon-16x16.png"),
            ("favicon-32x32.png", f"{pub_dir}/icons/favicon-32x32.png"),
            ("apple-touch-icon.png", f"{pub_dir}/apple-touch-icon.png"),
            ("pwa-192x192.png", f"{pub_dir}/pwa-192x192.png"),
            ("pwa-512x512.png", f"{pub_dir}/pwa-512x512.png"),
        ]
        for name, p in pwa_files:
            if os.path.exists(p):
                z.write(p, f"web-and-pwa/{name}")
                
        # 5. vector svg
        svg_files = [
            ("wellsaid-icon.svg", f"{pub_dir}/icons/icon.svg"),
            ("wellsaid-icon-transparent.svg", f"{pub_dir}/icons/transparent/icon-transparent.svg"),
        ]
        for name, p in svg_files:
            if os.path.exists(p):
                z.write(p, f"vector-svg/{name}")
                
        # 6. Readme
        z.writestr("README.txt", readme_content)

    print(f"Created {out_zip} ({os.path.getsize(out_zip)} bytes)")

if __name__ == '__main__':
    make_extension_zip()
    make_icons_pack_zip()
