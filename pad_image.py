from PIL import Image

img = Image.open('assets/placeholder.png')
w, h = img.size

# We want to zoom out a lot, so we make the canvas 2.5x larger
new_w = int(w * 2.5)
new_h = int(h * 2.5)

new_img = Image.new('RGBA', (new_w, new_h), (0, 0, 0, 0))
new_img.paste(img, ((new_w - w) // 2, (new_h - h) // 2))

new_img.save('assets/placeholder.png')
