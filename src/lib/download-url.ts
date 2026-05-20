export function buildDownloadUrl(sourceUrl?: string, filename = "smartstage-render.png") {
  if (!sourceUrl) {
    return "#";
  }

  if (sourceUrl.startsWith("data:")) {
    return sourceUrl;
  }

  return `/api/download?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;
}
