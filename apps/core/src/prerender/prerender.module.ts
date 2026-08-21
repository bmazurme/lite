import { Module } from '@nestjs/common';

import { PrerenderController } from './prerender.controller';
import { PrerenderService } from './prerender.service';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [NotesModule],
  controllers: [PrerenderController],
  providers: [PrerenderService],
})
export class PrerenderModule {}
