# Product photos

Each hair product page expects four images. Drop your photos in at these exact
paths and they automatically replace the labelled placeholder boxes (no code
change needed). Until a file exists, the page shows a labelled placeholder.

For every product folder below:

- `photo-1.jpg`  - main product shot ("Product photo")
- `photo-2.jpg`  - second angle / detail ("Another angle")
- `before.jpg`   - hair before using the product
- `after.jpg`    - hair after using the product

Product popups open from the "Products to style it" links inside a hairstyle
popup (and from product names mentioned in the maintenance text).

## Product folders

| Product               | Folder              |
| --------------------- | ------------------- |
| Curl Cream            | `curl-cream/`       |
| Sea Salt Spray        | `sea-salt-spray/`   |
| Texture Powder        | `texture-powder/`   |
| Matte Paste           | `matte-paste/`      |
| Pomade                | `pomade/`           |
| Heat Protectant Spray | `heat-protectant/`  |
| Hair Oil              | `hair-oil/`         |

Example: `frontend/Images/products/curl-cream/photo-1.jpg`

The product catalogue (names, descriptions, usage steps, image paths) lives in
the `PRODUCTS` object in `frontend/app.js` if you need to add or edit products.
