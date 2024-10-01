export interface S3Event {
  bucket: string;
  key: string;
}

export interface ValidationResult extends S3Event {}

export interface ExtractionResult extends ValidationResult {
  data: string;
}

export interface TransformResult extends ExtractionResult {}

export interface DatabaseUpdateResult extends ValidationResult {
  message: string;
  tableName: string;
}

export interface NotificationResult extends ValidationResult {}

export interface ExtractedData {
  [key: string]: string | number;
}

export interface FormattedItem {
  [key: string]: {
    S?: string;
    N?: string;
  };
}

export interface TransformData {
  [key: string]: string;
}

export interface DdbParams {
  tableName: string;
  Item: TransformData;
}
