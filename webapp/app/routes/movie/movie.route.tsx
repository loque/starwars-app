import { api, type Movie } from "~/lib/api";
import type { Route } from "./+types/movie.route";
import { H2, P } from "~/components/ui/text";
import { Link } from "react-router";
import {
  BackButton,
  DetailsBody,
  DetailsPage,
  DetailsSection,
  Subtitle,
} from "~/components/details/details";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Movie Details - SWStarter" },
    {
      name: "description",
      content: "An app that returns results from the Start Wars API",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { movieId } = params;
  const res = await api().get<Movie>(`/movies/${movieId}`);
  return res.data;
}

export default function MovieDetails({
  loaderData: movie,
}: Route.ComponentProps) {
  return (
    <DetailsPage data-slot="movie">
      <H2>{movie.title}</H2>
      <DetailsBody>
        <DetailsSection>
          <Subtitle>Opening Crawl</Subtitle>
          <P className="whitespace-pre-line text-sm">{movie.opening_crawl}</P>
        </DetailsSection>
        <DetailsSection>
          <Subtitle>Characters</Subtitle>
          {movie.characters.map((character, i) => (
            <span key={character.uid}>
              <Link
                to={{
                  pathname: `/person/${character.uid}`,
                }}
                className="test-sm text-link"
              >
                {character.name}
              </Link>
              {i < movie.characters.length - 1 && ", "}
            </span>
          ))}
        </DetailsSection>
      </DetailsBody>
      <BackButton />
    </DetailsPage>
  );
}
