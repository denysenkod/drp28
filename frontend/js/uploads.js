// ---------- Upload handler ----------
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function imageFileToDataUrl(file) {
  if (!file.type.startsWith("image/")) throw new Error("Please upload an image file.");

  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/webp", 0.84);
  } catch {
    return fileToDataUrl(file);
  }
}

function selectedFeatures() {
  const features = [];
  for (const question of DISCOVERY_FILTER_QUESTIONS) {
    for (const value of selectedFor(question)) {
      if (value !== "__all") features.push(value);
    }
  }
  return features;
}

