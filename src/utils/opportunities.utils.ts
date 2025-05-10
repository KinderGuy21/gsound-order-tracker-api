export function transformNextPageUrl(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);
    const params = url.searchParams;

    const limit = params.get('limit');
    const stageId = params.get('pipeline_stage_id');
    const startAfter = params.get('startAfter');
    const startAfterId = params.get('startAfterId');

    const newParams = new URLSearchParams();
    if (limit) newParams.set('limit', limit);
    if (stageId) newParams.set('stageIds', stageId);
    if (startAfter) newParams.set('startAfter', startAfter);
    if (startAfterId) newParams.set('startAfterId', startAfterId);

    return `${process.env.API_URL}/orders/opportunities?${newParams.toString()}`;
  } catch (error) {
    console.warn('Failed to transform nextPageUrl:', error);
    return '';
  }
}
