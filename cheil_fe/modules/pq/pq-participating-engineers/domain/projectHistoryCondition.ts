export type PqParticipatingEngineerProjectHistoryConditionType = "constructionKind" | "general" | "outline";
export type PqParticipatingEngineerProjectHistoryConditionOperator = "=" | "!=" | ">=" | "<=" | ">" | "<" | "LIKE" | "BETWEEN";
export type PqParticipatingEngineerProjectHistoryConditionValueType = "code" | "date" | "number" | "text";

export type PqParticipatingEngineerProjectHistoryCondition = {
  conditionType: PqParticipatingEngineerProjectHistoryConditionType;
  logicalOperator?: "AND" | "OR";
  /** Zero-based index of the first condition to include in this OR group. */
  orGroupStart?: number;
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

export function describeProjectHistoryConditionGroups(conditions: RelatedProjectHistoryCondition[]) {
  const groups: { start: number; expression: string }[] = [];
  const joinWithAnd = (entries: typeof groups) => entries.map((entry) => entry.expression).join(" AND ");
  const rows = conditions.map((condition, index) => {
    const options = groups.map((group, groupIndex) => {
      const expression = joinWithAnd(groups.slice(groupIndex));
      return { start: group.start, expression: groupIndex === groups.length - 1 ? expression : `(${expression})` };
    });
    const current = `#${index + 1}`;
    const isOr = index > 0 && condition.logicalOperator === "OR";
    const selectedOption = isOr ? options.find((option) => option.start === condition.orGroupStart) : undefined;

    if (selectedOption) {
      groups.splice(groups.findIndex((group) => group.start === selectedOption.start));
      groups.push({ start: selectedOption.start, expression: `(${selectedOption.expression} OR ${current})` });
    } else {
      groups.push({ start: index, expression: current });
    }

    return {
      options,
      condition: { ...condition, orGroupStart: selectedOption?.start },
    };
  });
  return { rows, expression: joinWithAnd(groups) };
}
