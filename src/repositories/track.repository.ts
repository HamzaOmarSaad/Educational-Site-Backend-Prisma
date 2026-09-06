import { BaseRepository } from "./base.repository";

export class TrackRepository extends BaseRepository<"Track"> {
  constructor() {
    super("Track");
  }

  // Add Track-specific query methods here.
}

const trackRepository = new TrackRepository();
export default trackRepository;
