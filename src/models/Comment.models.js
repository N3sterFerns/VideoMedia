import mongoose, {Schema} from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentSchema = new Schema({
    content: {
        type: String,
        required: [true, "Required Field"]
    },
    video:{
        type: Schema.Types.ObjectId,
        ref:"Video"
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

commentSchema.plugin(aggregatePaginate)


export const Comment = mongoose.model("Comment", commentSchema)
