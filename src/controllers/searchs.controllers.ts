import { NextFunction, Request, Response } from "express";
import { SearchQuery } from "~/models/requests/Search.requests";
import {ParamsDictionary} from 'express-serve-static-core'
import { searchService } from "~/services/search.services";
import { MediaTypeQuery, PeopleFollow } from "~/constants/enum";

 export async function searchController(req: Request, res: Response, next: NextFunction) {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const {user_id} = req.decoded_authorization
  const result = await searchService.search({
    limit,
    page,
    content: req.query.content as string,
    media_type: req.query.media_type as MediaTypeQuery,
    people_follow: req.query.people_follow as PeopleFollow,
    user_id
  }) as { tweets: Document[]; total: number };
  res.json({
    message: "search successfully",
    result : {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
  return
}