export type SwapiPersonDto = {
  uid: string;
  properties: {
    name: string;
    height: string;
    gender: string;
    birth_year: string;
    eye_color: string;
    hair_color: string;
    mass: string;
    films: string[];
  };
};

export type SwapiFilmDto = {
  uid: string;
  properties: {
    title: string;
    opening_crawl: string;
    characters: string[];
  };
};

export type SwapiSuccessDto<T> = {
  message: "ok";
  result: T[];
};

export type SwapiErrorDto = {
  message: string;
};

export type SwapiPerson = {
  uid: string;
  name: string;
  height: string;
  gender: string;
  birth_year: string;
  eye_color: string;
  hair_color: string;
  mass: string;
  movies: SwapiMovie[];
};

export type SwapiMovie = {
  uid: string;
  title: string;
  opening_crawl: string;
  characters: SwapiPerson[];
};
