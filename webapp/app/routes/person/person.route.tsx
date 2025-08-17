import { api, type Person } from "~/lib/api";
import type { Route } from "./+types/person.route";
import { H2 } from "~/components/ui/text";
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
    { title: "Person Details - SWStarter" },
    {
      name: "description",
      content: "An app that returns results from the Start Wars API",
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { personId } = params;
  const res = await api().get<Person>(`/people/${personId}`);
  return res.data;
}

export default function PersonDetails({
  loaderData: person,
}: Route.ComponentProps) {
  return (
    <DetailsPage data-slot="person">
      <H2>{person.name}</H2>
      <DetailsBody>
        <DetailsSection>
          <Subtitle>Details</Subtitle>
          <ul className="flex flex-col text-sm">
            <li>Birth Year: {person.birth_year}</li>
            <li>Gender: {person.gender}</li>
            <li>Eye Color: {person.eye_color}</li>
            <li>Hair Color: {person.hair_color}</li>
            <li>Height: {person.height}</li>
            <li>Mass: {person.mass}</li>
          </ul>
        </DetailsSection>
        <DetailsSection>
          <Subtitle>Movies</Subtitle>
          {person.movies.map((movie, i) => (
            <span key={movie.uid}>
              <Link
                to={{
                  pathname: `/movie/${movie.uid}`,
                }}
                className="test-sm text-link hover:underline decoration-link"
              >
                {movie.title}
              </Link>
              {i < person.movies.length - 1 && ", "}
            </span>
          ))}
        </DetailsSection>
      </DetailsBody>
      <BackButton />
    </DetailsPage>
  );
}
