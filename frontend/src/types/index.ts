// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

// Test types
export interface Test {
  id: number;
  name: string;
  description: string;
  question_count: number;
  questions: Question[];
  created_at: string;
  is_active: boolean;
}

export interface Question {
  id: number;
  text: string;
  order: number;
  answers: Answer[];
}

export interface Answer {
  id: number;
  text: string;
  value: number;
  personality_trait: string;
}

// Test result types
export interface TestResult {
  id: number;
  test: Test;
  answers: Record<string, number>;
  personality_map: PersonalityMap;
  score: Record<string, number>;
  response_time: Record<string, number>;
  confidence_levels: Record<string, number>;
  metadata: Record<string, any>;
  completed_at: string;
}

// Personality map types
export interface PersonalityMap {
  traits: Record<string, TraitInfo>;
  connections: Connection[];
  overall_score: number;
}

export interface TraitInfo {
  score: number;
  level: string;
  description: string;
  recommendations: string;
}

export interface Connection {
  from: string;
  to: string;
  strength: number;
  type?: string;
  correlation?: number;
  description?: string;
}

// Dynamic profile types
export interface DynamicProfile {
  traits: Record<string, DynamicTraitInfo>;
  connections: DynamicConnection[];
  inconsistencies: Inconsistency[];
  patterns: PatternAnalysis;
  overall_score: number;
  last_updated: string;
  total_tests: number;
  unique_traits: number;
}

export interface DynamicTraitInfo extends TraitInfo {
  stability: string;
  variance: number;
  test_count: number;
  evolution: TraitEvolution;
}

export interface TraitEvolution {
  history: TraitHistoryEntry[];
  average_score: number;
  variance: number;
  trend: string;
  consistency: string;
}

export interface TraitHistoryEntry {
  test_id: number;
  test_name: string;
  score: number;
  date: string;
  confidence: number;
  response_time: number;
}

export interface DynamicConnection extends Connection {
  type: 'correlation' | 'inconsistency';
  correlation?: number;
  description: string;
}

export interface Inconsistency {
  trait: string;
  type: string;
  description: string;
  severity: string;
}

export interface PatternAnalysis {
  trait_evolution: Record<string, TraitEvolution>;
  inconsistencies: Inconsistency[];
  correlations: Correlation[];
  trends: Record<string, any>;
  confidence_patterns: Record<string, any>;
  response_time_patterns: Record<string, any>;
}

export interface Correlation {
  trait1: string;
  trait2: string;
  correlation: number;
  strength: string;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface TestSubmission {
  answers: Record<string, number>;
  response_time?: Record<string, number>;
  confidence_levels?: Record<string, number>;
  metadata?: Record<string, any>;
}

// D3.js simulation types
export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  score: number;
  level: string;
  description: string;
  recommendations: string;
  stability?: string;
  variance?: number;
  test_count?: number;
  evolution?: TraitEvolution;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  strength: number;
  type?: string;
  correlation?: number;
  description?: string;
}
