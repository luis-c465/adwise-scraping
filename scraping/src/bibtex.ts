import type { Result } from "./result.js";

export function getBibtex(obj: Result) {
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

  const formattedDate = getFormattedDate(year, month, day);
  const description = obj?.description
    ?.replaceAll(/[^ -~]+/g, "")
    .replaceAll("%", " percent");
  const authors = (
    (obj?.authors as string[]) || (obj?.inventors as string)?.split(",")
  )
    ?.map((s) => s.trim())
    ?.join(" and ");

  const newObj: any = {
    ...obj,
    // pub_year: year,
    // year,
    // month: month?.length == 1 ? `0${month}` : month,
    // day: day?.length == 1 ? `0${day}` : day,
    // pubdate: formattedDate,
    date: formattedDate,
    // publicationDate: formattedDate,
    author: authors,
    authors,
    school: "Florida International University",
    number: obj?.issue,
    pages: (obj?.pages as string)?.replaceAll("-", "--"),
    description: null,
    abstract: description,
    booktitle: obj?.conference,
  };

  return `@${type}{kem${obj.scholarUrl.split(":")[2]}
      ${Object.entries(newObj)
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
        .join(",\n")}
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

export function shouldBeIncluded(obj: Result) {
  const index = /index/i;
  return (
    !((obj?.description?.match(index) ?? false) || obj?.title?.match(index)) &&
    (obj?.publicationDate ?? false)
  );
}
