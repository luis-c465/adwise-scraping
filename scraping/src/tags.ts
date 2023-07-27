import * as data from "./assets/pub.json";
import type { Result } from "./result.js";
import { reduceObject } from "./util.js";

export type PubData = {
  [key: string]: {
    publications: {
      year: number;
      fullText: string;
    }[];
  };
};

export function addTags(obj: Result) {
  const pubData = data as PubData;

  if (obj.tags) {
    return { ...obj, tags: obj.tags };
  }

  const likelyHoods = Object.entries(pubData).map(([key, value]) => {
    return {
      [key]: Math.max(
        ...(value.publications?.map(({ fullText }) =>
          similarity(obj.title, fullText)
        ) ?? [0])
      ),
    };
  });

  const likelyHood = reduceObject(likelyHoods);

  const [highestLikelyHood] = Object.entries(likelyHood).reduce(
    (prev, curr) => {
      return prev[1] > curr[1] ? prev : curr;
    }
  );

  return { ...obj, tags: highestLikelyHood };
}

export function similarity(s1: string, s2: string) {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (
    (longerLength - editDistance(longer, shorter)) /
    parseFloat(longerLength as never as string)
  );
}

export function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
