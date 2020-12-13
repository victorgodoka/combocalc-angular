import { cartesianProduct, combination } from 'js-combinatorics';

import { range, toTotal, merge } from './array.utils';
import { binomial } from './math.utils';

export interface CardCount {
  /**
   * searchers is number of cards in deck that can search for multiple different card groups.
   */
  names: string[];

  /**
   * minimum number selected by user. Usually 1. (This is a vector when it's a n>1 card combo.)
   */
  minDesired: number;

  /**
   * maximum number of cards from the number of copies that user wants in their hand. (This is a vector when it's a n>1 card combo.)
   */
  maxDesired: number;
}

export interface SearchGroup {
  /**
   * searchers is number of cards in deck that can search for multiple different card groups.
   */
  names: string[];

  /**
   * are which card groups from the searchers can be searched.
   * e.g. associations = [ [1,3], [2,4] ]; where the first searcher is associated with card groups 1 & 3,
   * second searcher is associated with card groups 2 & 4
   */
  associations: number[];
}

/**
 *
 * @param cardCounts the card groups and how many are in each
 * @param handSize number of cards user will draw from deck. Also called sampling size.
 * @param deckSize number of cards in the deck that the user has imported
 */
export const hypergeom = (
  cardCounts: CardCount[],
  handSize: number,
  deckSize: number
) => {
  const ranges = cardCounts.map(({ minDesired, maxDesired, names }) => {
    if (names.length < maxDesired) { return range(names.length, minDesired); }
    if (handSize < maxDesired) { return range(handSize, minDesired); }
    return range(maxDesired, minDesired);
  });

  const permutations: number[][] = cartesianProduct(...ranges)
    .toArray()
    .filter((args) => args.reduce(toTotal, 0) <= handSize); // calculate all the cases of min/max where it's less than or equal to handSize
  const totalCopies = cardCounts.map(({ names }) => names.length).reduce(toTotal, 0);

  let sum = 0;
  for (const args of permutations) {
    const argsTotal = args.reduce(toTotal, 0); // sum of current row in permutations
    const argBinomials = merge(args, cardCounts).map(([arg, { names }]) =>
      binomial(names.length, arg)
    );
    sum += argBinomials.reduce(
      (acc, result) => acc * result,
      binomial(deckSize - totalCopies, handSize - argsTotal)
    );
  }

  return sum / binomial(deckSize, handSize);
};

const applySearchGroup = (
  cardCounts: CardCount[],
  searchGroups: SearchGroup[],
  index?: number,
  associationCount?: number
): CardCount[] => {
  return [
    ...cardCounts.map((cardCount) => ({ ...cardCount })),
    ...searchGroups.map(({ names }, i) => ({
      names,
      minDesired: i === index ? associationCount : 0,
      maxDesired: i === index ? names.length : 0,
    })),
  ];
};

const applyAssociations = (
  cardCounts: CardCount[],
  searchGroups: SearchGroup[],
  associations: number[],
  currentSearchGroup: SearchGroup
): CardCount[] => {
  const lookupTable = new Set(associations);

  return applySearchGroup(
    cardCounts,
    searchGroups,
    searchGroups.indexOf(currentSearchGroup),
    associations.length
  ).map((cardCount, i) =>
    lookupTable.has(i)
      ? { ...cardCount, minDesired: 0, maxDesired: 0 }
      : cardCount
  );
};

/**
 * @param searchGroups the search groups
 * @param cardCounts the card groups and how many are in each
 * @param handSize number of cards user will draw from deck. Also called sampling size.
 * @param deckSize number of cards in the deck that the user has imported
 * Example:
 * 40-card deck
 * 5 card opening hand
 * 3 Card A, 2 Card B, 5 Searchers (can search for Card A or B)
 *
 * 1. 4.32% (0 Searchers, 1 Card A, 1 Card B)
 * 2. 12.53% (1 Searcher, 1 Card A, 0 Card B)
 * 3. 7.96% (1 Searcher, 0 Card A, 1 Card B)
 * 4. 6.85% (2 Searchers, 0 Card A, 0 Card B)
 * 5: 2.49% (1 Searcher, 1 Card A, 1 Card B)
 *
 * 4.32 + 12.53 + 7.96 + 6.85 + 2.49 = 34.15% chance total
 */
export const comboCalc = (
  searchGroups: SearchGroup[],
  cardCounts: CardCount[],
  handSize: number,
  deckSize: number
) => {
  if (searchGroups.map(({ names }) => names.length).reduce(toTotal, 0) === 0) {
    return hypergeom(cardCounts, handSize, deckSize);
  }

  let sum = 0;
  for (const searchGroup of searchGroups) {
    sum += hypergeom(
      applySearchGroup(cardCounts, searchGroups),
      handSize,
      deckSize
    );

    sum += hypergeom(
      applySearchGroup(cardCounts, searchGroups, 0, 1),
      handSize,
      deckSize
    );

    const possibleSearchers = Math.min(
      searchGroup.associations.length,
      searchGroup.names.length
    );
    for (const searcherCount of range(possibleSearchers, 1)) {
      for (const associations of combination(
        searchGroup.associations,
        searcherCount
      ).toArray()) {
        sum += hypergeom(
          applyAssociations(
            cardCounts,
            searchGroups,
            associations,
            searchGroup
          ),
          handSize,
          deckSize
        );
      }
    }
  }

  return sum;
};
