import { NextResponse } from "next/server";
import { fetchBenchmarkData, isValidMetric, type BenchmarkMetricId } from "@/lib/benchmarks";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawMetric = searchParams.get("metric");
  const metric: BenchmarkMetricId = isValidMetric(rawMetric)
    ? rawMetric
    : "aa-intelligence";

  const data = await fetchBenchmarkData(metric);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
