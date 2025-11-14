#!/usr/bin/env python3
"""
Generate simple PNG icons for the Chrome extension
"""

try:
    from PIL import Image, ImageDraw
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("PIL/Pillow not available. Creating minimal placeholder PNGs.")

import struct

def create_minimal_png(size, output_path):
    """Create a minimal valid PNG file with a gradient-like pattern"""
    # Simple PNG with gradient colors
    width = height = size

    # PNG signature
    png_data = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # RGB
    ihdr_chunk = b'IHDR' + ihdr_data
    ihdr_crc = crc32(ihdr_chunk)
    png_data += struct.pack('>I', len(ihdr_data)) + ihdr_chunk + struct.pack('>I', ihdr_crc)

    # IDAT chunk - simple gradient pattern
    import zlib
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type
        for x in range(width):
            # Create a purple-blue gradient
            r = int(102 + (118 - 102) * (x / width))
            g = int(126 + (75 - 126) * (y / height))
            b = int(234 + (162 - 234) * ((x + y) / (width + height)))
            raw_data += bytes([r, g, b])

    compressed_data = zlib.compress(raw_data, 9)
    idat_chunk = b'IDAT' + compressed_data
    idat_crc = crc32(idat_chunk)
    png_data += struct.pack('>I', len(compressed_data)) + idat_chunk + struct.pack('>I', idat_crc)

    # IEND chunk
    iend_chunk = b'IEND'
    iend_crc = crc32(iend_chunk)
    png_data += struct.pack('>I', 0) + iend_chunk + struct.pack('>I', iend_crc)

    with open(output_path, 'wb') as f:
        f.write(png_data)

    print(f"Created {output_path}")

def crc32(data):
    """Calculate CRC32 checksum"""
    import binascii
    return binascii.crc32(data) & 0xffffffff

def create_icon_with_pil(size, output_path):
    """Create icon using PIL/Pillow"""
    # Create image with gradient
    img = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(img)

    # Draw gradient background
    for y in range(size):
        for x in range(size):
            r = int(102 + (118 - 102) * (x / size))
            g = int(126 + (75 - 126) * (y / size))
            b = int(234 + (162 - 234) * ((x + y) / (size * 2)))
            img.putpixel((x, y), (r, g, b))

    # Draw simple icon elements
    center_x = size // 2
    dot_radius = max(2, size // 15)
    spacing = size // 4

    # Draw three dots
    for i in range(3):
        y = center_x + (i - 1) * spacing
        draw.ellipse(
            [center_x - spacing - dot_radius, y - dot_radius,
             center_x - spacing + dot_radius, y + dot_radius],
            fill='white'
        )

        # Draw arrows
        arrow_x = center_x + spacing // 2
        line_width = max(1, size // 50)
        draw.line(
            [center_x - spacing + dot_radius, y, arrow_x, y],
            fill='white',
            width=line_width
        )

        # Arrow head
        head_size = max(2, size // 25)
        draw.line(
            [arrow_x - head_size, y - head_size, arrow_x, y],
            fill='white',
            width=line_width
        )
        draw.line(
            [arrow_x - head_size, y + head_size, arrow_x, y],
            fill='white',
            width=line_width
        )

    # Corner brackets
    corner_size = size // 10
    corner_offset = size // 10
    bracket_width = max(1, size // 40)

    # Top-left
    draw.line([corner_offset + corner_size, corner_offset, corner_offset, corner_offset], fill='#48bb78', width=bracket_width)
    draw.line([corner_offset, corner_offset, corner_offset, corner_offset + corner_size], fill='#48bb78', width=bracket_width)

    # Top-right
    draw.line([size - corner_offset - corner_size, corner_offset, size - corner_offset, corner_offset], fill='#48bb78', width=bracket_width)
    draw.line([size - corner_offset, corner_offset, size - corner_offset, corner_offset + corner_size], fill='#48bb78', width=bracket_width)

    # Bottom-left
    draw.line([corner_offset, size - corner_offset - corner_size, corner_offset, size - corner_offset], fill='#48bb78', width=bracket_width)
    draw.line([corner_offset, size - corner_offset, corner_offset + corner_size, size - corner_offset], fill='#48bb78', width=bracket_width)

    # Bottom-right
    draw.line([size - corner_offset, size - corner_offset - corner_size, size - corner_offset, size - corner_offset], fill='#48bb78', width=bracket_width)
    draw.line([size - corner_offset - corner_size, size - corner_offset, size - corner_offset, size - corner_offset], fill='#48bb78', width=bracket_width)

    img.save(output_path, 'PNG')
    print(f"Created {output_path}")

if __name__ == '__main__':
    import os

    icons_dir = 'icons'
    os.makedirs(icons_dir, exist_ok=True)

    sizes = [16, 48, 128]

    if PIL_AVAILABLE:
        print("Using PIL/Pillow to generate icons...")
        for size in sizes:
            create_icon_with_pil(size, f'{icons_dir}/icon{size}.png')
    else:
        print("Using basic PNG generation (no PIL)...")
        for size in sizes:
            create_minimal_png(size, f'{icons_dir}/icon{size}.png')

    print("\nAll icons generated successfully!")
    print("Icons are located in the 'icons' directory.")
