export interface ClassificationReference {
  id: string | number;
  name: string;
  code: string;
}

export interface ClassificationPreviewPayload {
  title: string;
  description: string;
}

export interface ClassificationAlternative {
  department?: ClassificationReference | null;
  category?: ClassificationReference | null;
  confidence: number;
}

export interface ClassificationPreviewResult {
  department?: ClassificationReference | null;
  category?: ClassificationReference | null;
  confidence: number;
  matched_keywords: string[];
  alternatives: ClassificationAlternative[];
  method: string;
}
