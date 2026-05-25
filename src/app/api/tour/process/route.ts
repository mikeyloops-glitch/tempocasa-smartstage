import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const houseDemoSceneUrl = "https://superspl.at/scene/e721ea7c";

type ProviderStatus = "queued" | "processing" | "ready" | "failed";

type TourProcessResult = {
  demo?: boolean;
  jobId?: string;
  message: string;
  output?: {
    contentUrl?: string;
    downloadUrl?: string;
    fileType?: string;
    sceneUrl?: string;
    viewerUrl?: string;
  };
  progress?: number;
  provider: string;
  status: ProviderStatus;
  statusUrl?: string;
};

type UnknownRecord = Record<string, unknown>;

function isConfigured(value: string | undefined): value is string {
  return Boolean(value && value.trim() && !value.includes("replace_me"));
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function firstString(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstNumber(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function normalizeStatus(rawStatus: string | undefined, hasOutput: boolean): ProviderStatus {
  const status = rawStatus?.toLowerCase() ?? "";

  if (status.includes("fail") || status.includes("error") || status.includes("cancel")) {
    return "failed";
  }

  if (status.includes("complete") || status.includes("success") || status.includes("ready") || status.includes("done")) {
    return "ready";
  }

  if (status.includes("queue") || status.includes("pending") || status.includes("waiting")) {
    return "queued";
  }

  if (hasOutput) {
    return "ready";
  }

  return "processing";
}

function buildViewerUrl(contentUrl: string | undefined, explicitViewerUrl: string | undefined) {
  if (explicitViewerUrl) {
    return explicitViewerUrl;
  }

  if (!contentUrl) {
    return undefined;
  }

  if (contentUrl.startsWith("https://superspl.at/scene/")) {
    return contentUrl;
  }

  return `/supersplat-viewer?content=${encodeURIComponent(contentUrl)}&aa&nofx`;
}

function stripBrowserOnlyUrls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripBrowserOnlyUrls);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as UnknownRecord).map(([key, item]) => {
      if (typeof item === "string" && item.startsWith("blob:")) {
        return [key, null];
      }

      return [key, stripBrowserOnlyUrls(item)];
    })
  );
}

function normalizeProviderResult(payload: unknown, options: { demo?: boolean; provider?: string } = {}): TourProcessResult {
  const root = asRecord(payload);
  const nestedCandidates = [
    root,
    asRecord(root.result),
    asRecord(root.data),
    asRecord(root.output),
    asRecord(root.outputs),
    asRecord(root.scene),
    asRecord(root.asset)
  ];
  const merged = Object.assign({}, ...nestedCandidates);

  const viewerUrl = firstString(merged, ["viewerUrl", "viewer_url", "viewer", "embedUrl", "embed_url"]);
  const contentUrl = firstString(merged, [
    "contentUrl",
    "content_url",
    "splatUrl",
    "splat_url",
    "sogUrl",
    "sog_url",
    "plyUrl",
    "ply_url",
    "assetUrl",
    "asset_url",
    "fileUrl",
    "file_url",
    "sceneUrl",
    "scene_url",
    "url"
  ]);
  const downloadUrl = firstString(merged, ["downloadUrl", "download_url", "exportUrl", "export_url"]);
  const outputViewerUrl = buildViewerUrl(contentUrl, viewerUrl);
  const status = normalizeStatus(firstString(merged, ["status", "state", "phase"]), Boolean(contentUrl || viewerUrl));
  const progress = firstNumber(merged, ["progress", "percent", "percentage"]);

  return {
    demo: options.demo,
    jobId: firstString(merged, ["jobId", "job_id", "id", "taskId", "task_id"]),
    message:
      firstString(merged, ["message", "summary", "detail"]) ??
      (status === "ready"
        ? "3D tour is ready in the viewer."
        : status === "failed"
          ? "3D reconstruction failed."
          : "3D reconstruction is processing."),
    output:
      contentUrl || outputViewerUrl || downloadUrl
        ? {
            contentUrl,
            downloadUrl,
            fileType: firstString(merged, ["fileType", "file_type", "format", "extension"]),
            sceneUrl: firstString(merged, ["sceneUrl", "scene_url"]),
            viewerUrl: outputViewerUrl
          }
        : undefined,
    progress: progress === undefined ? undefined : Math.max(0, Math.min(100, progress)),
    provider: options.provider ?? firstString(merged, ["provider", "service"]) ?? "external-reconstruction",
    status,
    statusUrl: firstString(merged, ["statusUrl", "status_url", "pollUrl", "poll_url"])
  };
}

function demoResult(): TourProcessResult {
  return {
    demo: true,
    message: "Demo processing complete. Add TOUR_RECONSTRUCTION_API_URL to connect the real 3D reconstruction pipeline.",
    output: {
      contentUrl: houseDemoSceneUrl,
      sceneUrl: houseDemoSceneUrl,
      viewerUrl: houseDemoSceneUrl
    },
    progress: 100,
    provider: "tempo-demo-pipeline",
    status: "ready"
  };
}

function authHeaders() {
  const key = process.env.TOUR_RECONSTRUCTION_API_KEY;
  const headerName = process.env.TOUR_RECONSTRUCTION_AUTH_HEADER || "Authorization";

  if (!isConfigured(key)) {
    return undefined;
  }

  return {
    [headerName]: headerName.toLowerCase() === "authorization" ? `Bearer ${key}` : key as string
  };
}

async function readProviderResponse(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function POST(request: Request) {
  const apiUrl = process.env.TOUR_RECONSTRUCTION_API_URL;
  const configuredApiUrl = isConfigured(apiUrl) ? apiUrl.trim() : undefined;
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Virtual-tour processing payload could not be read." }, { status: 400 });
  }

  const manifestText = formData.get("manifest");

  if (typeof manifestText !== "string") {
    return NextResponse.json({ message: "Missing virtual-tour manifest." }, { status: 400 });
  }

  let manifest: unknown;

  try {
    manifest = JSON.parse(manifestText);
  } catch {
    return NextResponse.json({ message: "Virtual-tour manifest is not valid JSON." }, { status: 400 });
  }

  if (!configuredApiUrl) {
    return NextResponse.json({ result: demoResult(), manifest }, { status: 202 });
  }

  const outbound = new FormData();
  outbound.append("manifest", JSON.stringify(stripBrowserOnlyUrls(manifest)));
  outbound.append("mediaIndex", String(formData.get("mediaIndex") ?? "[]"));
  outbound.append("outputFormat", process.env.TOUR_RECONSTRUCTION_OUTPUT_FORMAT ?? "sog");
  outbound.append("viewer", "supersplat");

  for (const file of formData.getAll("media")) {
    if (file instanceof File) {
      outbound.append("media", file, file.name);
    }
  }

  try {
    const response = await fetch(configuredApiUrl, {
      body: outbound,
      headers: authHeaders(),
      method: "POST"
    });
    const payload = await readProviderResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          result: {
            message: normalizeProviderResult(payload).message,
            provider: "external-reconstruction",
            status: "failed"
          },
          raw: payload
        },
        { status: 502 }
      );
    }

    const result = normalizeProviderResult(payload);
    return NextResponse.json({ result, raw: payload }, { status: result.status === "ready" ? 200 : 202 });
  } catch (error) {
    console.error("Virtual tour reconstruction request failed", error);
    return NextResponse.json(
      {
        result: {
          message: "The configured 3D reconstruction API could not be reached.",
          provider: "external-reconstruction",
          status: "failed"
        }
      },
      { status: 502 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId") ?? undefined;
  const explicitStatusUrl = searchParams.get("statusUrl") ?? undefined;
  const statusTemplate = process.env.TOUR_RECONSTRUCTION_STATUS_URL;
  const apiUrl = process.env.TOUR_RECONSTRUCTION_API_URL;
  const configuredStatusTemplate = isConfigured(statusTemplate) ? statusTemplate.trim() : undefined;
  const configuredApiUrl = isConfigured(apiUrl) ? apiUrl.trim() : undefined;

  const statusUrl = explicitStatusUrl?.startsWith("http")
    ? explicitStatusUrl
    : configuredStatusTemplate && jobId
      ? configuredStatusTemplate.replace("{jobId}", encodeURIComponent(jobId))
      : configuredApiUrl && jobId
        ? `${configuredApiUrl.replace(/\/$/, "")}/${encodeURIComponent(jobId)}`
        : undefined;

  if (!statusUrl) {
    return NextResponse.json({ message: "Missing reconstruction job status URL." }, { status: 400 });
  }

  try {
    const response = await fetch(statusUrl, {
      headers: authHeaders(),
      method: "GET"
    });
    const payload = await readProviderResponse(response);
    const result = normalizeProviderResult(payload);

    return NextResponse.json({ result, raw: payload }, { status: response.ok ? 200 : 502 });
  } catch (error) {
    console.error("Virtual tour reconstruction status request failed", error);
    return NextResponse.json(
      {
        result: {
          jobId,
          message: "The configured 3D reconstruction status endpoint could not be reached.",
          provider: "external-reconstruction",
          status: "failed"
        }
      },
      { status: 502 }
    );
  }
}
