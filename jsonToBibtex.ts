import { promises as fs } from "fs";
import { nanoid } from "nanoid";

type Result = {
    title: string;
    url: string;
    year: string;
    date: string;
    description: string;

    articles: string;

    [key: string]: string | string[] | null;
} & (
    | {
          inventors: string[];
          office: string;
          number: string;
      }
    | {
          authors: string[];
      }
    | {
          journal: string;
          volume: string;
          pages: string;
      }
);

async function main() {
    const fData = await fs.readFile("./data/withTags.json", {
        encoding: "utf-8",
    });

    const data = JSON.parse(fData) as Result[];

    const index = /index/i;
    const bibtex = data
        .filter(
            (p) =>
                !(
                    (p?.description?.match(index) ?? false) ||
                    p?.title?.match(index)
                ) &&
                (p?.publicationDate ?? false)
        )
        .map(getBibtex)
        .join("\n\n");
    await fs.writeFile("./data/results2.bib", bibtex, {
        encoding: "utf-8",
    });
}

function getBibtex(obj: Result) {
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

    return `@${type}{kem${nanoid(6)}
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

main();
