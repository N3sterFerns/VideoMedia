import mongoose,{Schema} from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new Schema({
    videoFile: {
        type: String,
        required: true
    },
    thumbnail:{
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true,
        maxLength: 100
    },
    description:{
        type: String,
        required: true,
    },
    duration:{
        type: Number,
        required: true
    },
    views:{
        type: Number,
        default: 0
    },
    isPublished:{
        type: Boolean,
        default: false
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

videoSchema.plugin(aggregatePaginate)
videoSchema.index({title: "text", description: "text"})
// videoSchema.index({title: "text", description: "text"})

export const Video = mongoose.model("Video", videoSchema)
