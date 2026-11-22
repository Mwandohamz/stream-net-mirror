export interface PublishableHighlight {
  is_embeddable: boolean;
  availability_status: string;
  api_data_expires_at: string;
}
export function canPublishHighlight(video: PublishableHighlight, sourceEnabled: boolean, now = Date.now()) {
  return sourceEnabled && video.is_embeddable && video.availability_status === "available"
    && Date.parse(video.api_data_expires_at) > now;
}