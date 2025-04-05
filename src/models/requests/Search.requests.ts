import { MediaTypeQuery, PeopleFollow } from "~/constants/enum";

export interface SearchQuery {
  content: string;
  limit: string;
  page: string;
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollow;
}