import { promises as fs } from "fs";

type PubData = {
    [key: string]: {
        publications: {
            year: number;
            fullText: string;
        }[];
    };
};

type Result = { title: string, tags?: string };
type ResultsData = Result[];

type NewResult = Result & { tags: string };

async function main() {
    const resultsData: ResultsData = JSON.parse(
        await fs.readFile("./data/resultsTag.json", {
            encoding: "utf-8",
        })
    );

    const pubData: PubData = JSON.parse(
        await fs.readFile("./data/pubFinal.json", {
            encoding: "utf-8",
        })
    );

    const newResults: NewResult[] = []

    for (const result of resultsData) {
        if (result.tags) {
            newResults.push({
                ...result,
                tags: result.tags
            })
            continue;
        }

        const likelyHoods = Object.entries(pubData).map(([key, value]) => {
            return {
                [key]: Math.max(
                    ...value.publications.map(({ fullText }) =>
                        similarity(result.title, fullText)
                    )
                ),
            };
        });

        const likelyHood = reduceObject(likelyHoods);

        const [highestLikelyHood] = Object.entries(likelyHood).reduce(
            (prev, curr) => {
                return prev[1] > curr[1] ? prev : curr;
            }
        );

        newResults.push({
            ...result,
            tags: highestLikelyHood,
        })
    }

    await fs.writeFile("./data/withTags.json", JSON.stringify(newResults), {
        encoding: "utf-8",
    });
}

function similarity(s1: string, s2: string) {
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

function editDistance(s1: string, s2: string) {
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
                        newValue =
                            Math.min(Math.min(newValue, lastValue), costs[j]) +
                            1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function reduceObject<T>(objects: T[]): T {
    return objects.reduce((o, i) => {
        const [key, value] = Object.entries(i)[0];
        return Object.assign(o, { [key]: value });
    }, {}) as T;
}

main();
