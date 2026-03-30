export type NormalizedFieldValue =
  | {
      type: "string";
      value: string;
    }
  | {
      type: "number";
      value: number;
    }
  | {
      type: "boolean";
      value: boolean;
    }
  | {
      type: "date";
      value: string;
    }
  | {
      type: "string_list";
      value: string[];
    };
