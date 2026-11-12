import os
import zipfile

def pack():
    ext_dir = os.path.abspath('extension')
    out_zip = os.path.abspath('public/wellsaid-extension.zip')
    
    os.makedirs(os.path.dirname(out_zip), exist_ok=True)
    
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ext_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ext_dir)
                zf.write(full_path, rel_path)
                
    print(f"Packed extension to {out_zip} ({os.path.getsize(out_zip)} bytes)")

if __name__ == '__main__':
    pack()
