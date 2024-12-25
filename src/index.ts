import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import { UserModel, ContentModel, LinkModel } from "./db";
import bcrypt from "bcrypt";
import { userMiddleware } from "./middleware";
import { random } from "./utilis";
import cors from "cors";
import { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("");

app.post("/signup", async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const hashpassword = await bcrypt.hash(password, 4);

  try {
    const response = await UserModel.create({
      email,
      username,
      password: hashpassword,
    });
    res.status(202).json({ message: "Signup successful" });
  } catch (error) {
    res.status(403).json({ message: "Error while signing up" });
  }
});

app.post("/signin", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const existingUser = await UserModel.findOne({ username });

    if (!existingUser) {
      res.status(403).json({ message: "User does not exist" });
      return;
    }
//@ts-ignore
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordValid) {
      res.status(403).json({ message: "Password incorrect" });
      return;
    }

    const token = jwt.sign(
      {
        id: existingUser._id,
      },
      JWT_SECRET
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/content", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { link, type, title, tags } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    await ContentModel.create({
      link,
      type,
      title,
      tags: tags || [],
      userId,
    });
    res.json({ message: "Content added" });
  } catch (error) {
    res.status(500).json({ message: "Error adding content" });
  }
});

app.get("/content", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const content = await ContentModel.find({ userId }).populate("userId", "username");
    res.json({ content });
  } catch (error) {
    res.status(500).json({ message: "Error fetching content" });
  }
});

app.delete("/content", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { contentId } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    await ContentModel.deleteOne({ _id: contentId, userId });
    res.json({ message: "Content deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting content" });
  }
});

app.post("/share", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { share } = req.body;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    if (share) {
      const existingLink = await LinkModel.findOne({ userId });

      if (existingLink) {
        res.json({ hash: existingLink.hash });
        return;
      }

      const hash = random(10);
      await LinkModel.create({ userId, hash });
      res.json({ hash });
    } else {
      await LinkModel.deleteOne({ userId });
      res.json({ message: "Removed link" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error sharing content" });
  }
});

app.get("/:sharelink", async (req: Request, res: Response) => {
  const { sharelink: hash } = req.params;

  try {
    const link = await LinkModel.findOne({ hash });

    if (!link) {
      res.status(403).json({ message: "Incorrect inputs" });
      return;
    }

    const content = await ContentModel.find({ userId: link.userId });
    const user = await UserModel.findById(link.userId);

    if (!user) {
      res.status(404).json({ message: "User does not exist" });
      return;
    }

    res.json({
      username: user.username,
      content,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching shared content" });
  }
});

app.listen(3000, () => console.log("Server is running on port 3000"));
