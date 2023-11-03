import { Result } from "./main.js";

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
    const year = (obj?.publicationDate as string)?.split("/")[0];
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
        pub_year: year,
        year,
        date: null,
        publicationDate: null,
        author: authors,
        authors,
        school: "Florida International University",
        number: obj?.issue,
        pages: (obj?.pages as string)?.replaceAll("-", "--"),
        description: null,
        abstract: description,
    };

    return `@${type}{kem${obj.scholarUrl.split(":")[1]}
      ${Object.entries(newObj)
          .filter(
              ([key, value]) =>
                  key &&
                  value &&
                  !["scholarArticles", "totalCitations"].includes(key)
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

export function shouldBeIncluded(obj: Result) {
    const index = /index/i;
    return (
        !(
            (obj?.description?.match(index) ?? false) ||
            obj?.title?.match(index)
        ) &&
        (obj?.publicationDate ?? false)
    );
}
