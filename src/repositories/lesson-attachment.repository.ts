import { BaseRepository } from "./base.repository";

export class LessonAttachmentRepository extends BaseRepository<"LessonAttachment"> {
  constructor() {
    super("LessonAttachment");
  }

  // Add LessonAttachment-specific query methods here.
}

const lessonAttachmentRepository = new LessonAttachmentRepository();
export default lessonAttachmentRepository;
