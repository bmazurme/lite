import { Controller, Get, Header } from '@nestjs/common';

import { FeedService } from './feed.service';

@Controller()
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('rss.xml')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  getRss(): Promise<string> {
    return this.feedService.generateRss();
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  getSitemap(): Promise<string> {
    return this.feedService.generateSitemap();
  }
}
