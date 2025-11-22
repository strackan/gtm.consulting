/**
 * PowerPak Server Types
 */

export interface PowerPakMetadata {
  name: string;
  description: string;
  tier?: 'basic' | 'premium' | 'platinum';
  [key: string]: any;
}

export interface PowerPakProfile {
  expert?: string;
  tier?: string;
  bio?: string;
  coreExpertise?: string[];
  photo?: string;
  links?: Array<{ label: string; url: string }>;
}

export interface PowerPakSection {
  id: string;
  title: string;
  level: number;
  content: string;
  subsections?: PowerPakSection[];
}

export interface PowerPakData {
  metadata: PowerPakMetadata;
  profile?: PowerPakProfile;
  sections: PowerPakSection[];
  rawContent: string;
}

export interface FrameworkQuery {
  category?: string;
  keywords?: string[];
  section?: string;
}

export interface SkillQuery {
  section?: string;
  keywords?: string[];
  maxResults?: number;
}
