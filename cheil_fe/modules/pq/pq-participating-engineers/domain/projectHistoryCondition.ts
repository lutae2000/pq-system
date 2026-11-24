export type PqParticipatingEngineerProjectHistoryConditionType = "constructionKind" | "general" | "outline";
export type PqParticipatingEngineerProjectHistoryConditionOperator = "=" | "!=" | ">=" | "<=" | ">" | "<" | "LIKE" | "BETWEEN";
export type PqParticipatingEngineerProjectHistoryConditionValueType = "code" | "date" | "number" | "text";

export type PqParticipatingEngineerProjectHistoryCondition = {
  conditionType: PqParticipatingEngineerProjectHistoryConditionType;
  logicalOperator?: "AND" | "OR";
  label?: string;
  level1Code?: string;
  level2Code?: string;
  level3Code?: string;
  generalCode?: string;
  outlineCategoryCode?: string;
  outlineSubcategoryCode?: string;
  operator?: PqParticipatingEngineerProjectHistoryConditionOperator;
  value?: string;
  valueTo?: string;
  valueType?: PqParticipatingEngineerProjectHistoryConditionValueType;
};

export type RelatedProjectHistoryCondition = PqParticipatingEngineerProjectHistoryCondition & {
  id: string;
};
