import { Types } from "mongoose";
import { AvailabilityEnum } from "../../Enums";
import { HUser } from "../../interfaces";

// see if the user have the right to interact with this post
export const getAvailability = (user: HUser) => {
  return [
    { availability: AvailabilityEnum.public },
    { availability: AvailabilityEnum.onlyMe, createdBy: user._id },
    {
      availability: AvailabilityEnum.private,
      createdBy: {
        $in: [user._id, ...((user.friends as Types.ObjectId[]) || [])],
      },
    },
    { tags: { $in: [user._id] } },
  ];
};
