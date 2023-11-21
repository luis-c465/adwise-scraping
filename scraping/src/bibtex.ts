import type { ResultWithTags } from "./tags.js";

export function getBibtex(obj: ResultWithTags) {
  if (!shouldBeIncluded(obj)) {
    return null;
  }

  const type = obj.url.includes("ieee.org")
    ? "inproceedings"
    : obj.url.includes("patent/US")
    ? "patent"
    : "article";

  // Comment this out bc this is only for some minor fuckups
  const [year, month, day] = (obj?.publicationDate as string)?.split("/") ?? [
    null,
    null,
    null,
  ];

  const authors = (
    (obj?.authors as string[]) || (obj?.inventors as string)?.split(",")
  )?.map((s) => s.trim());

  const firstAuthorLastName = authors.at(0).split(" ")[1];
  const id = `${firstAuthorLastName}${year}${month}${day}`;

  const formattedDate = getFormattedDate(year, month, day);
  const description = obj?.description
    ?.replaceAll(/[^ -~]+/g, "")
    .replaceAll("%", " percent");
  const authorsStr = authors?.join(" and ");

  const newObj: any = {
    ...obj,
    date: formattedDate,
    author: authorsStr,
    authors: authorsStr,
    school: "Florida International University",
    number: obj?.issue,
    pages: (obj?.pages as string)?.replaceAll("-", "--"),
    description: null,
    abstract: description,
    booktitle: obj?.conference,
  };

  const bibtexBody = Object.entries(newObj)
    .filter(
      ([key, value]) =>
        key && value && !["scholarArticles", "totalCitations"].includes(key)
    )
    .map(([key, value]) => {
      if (!key || !value) {
        return "";
      }

      return `${key} = \{${value}\}`;
    })
    .join(",\n");

  return `@${type}{${id}
      ${bibtexBody}
    }`;
}

export function getFormattedDate(year: string, month?: string, day?: string) {
  let temp = year;
  if (month) {
    temp += `-${month.length === 1 ? `0${month}` : month}`;
  } else {
    temp += "-00";
  }

  if (day) {
    temp += `-${day.length === 1 ? `0${day}` : day}`;
  } else {
    temp += "-00";
  }

  return temp;
}

export function shouldBeIncluded(obj: ResultWithTags) {
  const index = /index/i;
  return (
    !((obj?.description?.match(index) ?? false) || obj?.title?.match(index)) &&
    (obj?.publicationDate ?? false)
  );
}
