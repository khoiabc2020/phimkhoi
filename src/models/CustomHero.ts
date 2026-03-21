import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomHero extends Document {
    movieId: string;
    slug: string;
    name: string;
    layer_bg: string;
    layer_character: string;
    layer_logo: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CustomHeroSchema: Schema = new mongoose.Schema(
    {
        movieId: { type: String, required: true },
        slug: { type: String, required: true },
        name: { type: String, required: true },
        layer_bg: { type: String, required: true },
        layer_character: { type: String, required: true },
        layer_logo: { type: String, required: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CustomHeroSchema.index({ order: 1 });
CustomHeroSchema.index({ isActive: 1 });
CustomHeroSchema.index({ slug: 1 });

const CustomHero: Model<ICustomHero> =
    mongoose.models.CustomHero || mongoose.model<ICustomHero>("CustomHero", CustomHeroSchema);

export default CustomHero;
