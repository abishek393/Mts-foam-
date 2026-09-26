// Central model registry. Importing this module loads every model and wires
// the associations between them — server.js imports only this, so a new model
// never means another import line in the entry point.
import { sequelize } from "../config/database.js";
import User from "./User.js";
import Product from "./Product.js";
import Dealer from "./Dealer.js";
import DealerApplication from "./DealerApplication.js";
import Offer from "./Offer.js";
import Inquiry from "./Inquiry.js";
import Order from "./Order.js";
import OrderItem from "./OrderItem.js";
import Favourite from "./Favourite.js";
import PendingRegistration from "./PendingRegistration.js";
import Review from "./Review.js";
import Setting from "./Setting.js";
import Conversation from "./Conversation.js";
import Message from "./Message.js";
import DailyReport from "./DailyReport.js";

// Inquiry → who raised it, and what about
Inquiry.belongsTo(User, { as: "customer", foreignKey: "userId" });
User.hasMany(Inquiry, { as: "inquiries", foreignKey: "userId" });

Inquiry.belongsTo(Product, { as: "product", foreignKey: "productId" });
Product.hasMany(Inquiry, { as: "inquiries", foreignKey: "productId" });

Inquiry.belongsTo(User, { as: "assignee", foreignKey: "assignedTo" });

// Order → its customer and its lines. Deleting an order takes its lines with it.
Order.belongsTo(User, { as: "customer", foreignKey: "userId" });
User.hasMany(Order, { as: "orders", foreignKey: "userId" });

Order.hasMany(OrderItem, { as: "items", foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { as: "order", foreignKey: "orderId" });

OrderItem.belongsTo(Product, { as: "product", foreignKey: "productId" });

Order.belongsTo(User, { as: "assignee", foreignKey: "assignedTo" });

// Who confirmed the payment screenshot against the bank.
Order.belongsTo(User, { as: "paymentVerifier", foreignKey: "paymentVerifiedBy" });

// Favourites → a saved product per user
Favourite.belongsTo(User, { as: "user", foreignKey: "userId" });
User.hasMany(Favourite, { as: "favourites", foreignKey: "userId" });

Favourite.belongsTo(Product, { as: "product", foreignKey: "productId" });
Product.hasMany(Favourite, { as: "favouritedBy", foreignKey: "productId" });

// Reviews → who wrote it, about what, and the order that entitles it
Review.belongsTo(User, { as: "author", foreignKey: "userId" });
User.hasMany(Review, { as: "reviews", foreignKey: "userId" });

Review.belongsTo(Product, { as: "product", foreignKey: "productId" });
Product.hasMany(Review, { as: "reviews", foreignKey: "productId" });

Review.belongsTo(Order, { as: "order", foreignKey: "orderId" });

// Field sales → the marketer who took an order, and their daily reports
Order.belongsTo(User, { as: "placedBy", foreignKey: "placedById" });

DailyReport.belongsTo(User, { as: "marketer", foreignKey: "userId" });
User.hasMany(DailyReport, { as: "dailyReports", foreignKey: "userId" });

DailyReport.belongsTo(User, { as: "reviewer", foreignKey: "reviewedBy" });

// Chat → one conversation per customer, many messages in it
Conversation.belongsTo(User, { as: "customer", foreignKey: "userId" });
User.hasOne(Conversation, { as: "conversation", foreignKey: "userId" });

Conversation.belongsTo(User, { as: "assignee", foreignKey: "assignedTo" });

Conversation.hasMany(Message, {
    as: "messages",
    foreignKey: "conversationId",
    onDelete: "CASCADE",
});
Message.belongsTo(Conversation, { as: "conversation", foreignKey: "conversationId" });

Message.belongsTo(User, { as: "sender", foreignKey: "senderId" });
Message.belongsTo(Product, { as: "product", foreignKey: "productId" });

// Dealer directory entry → its login, once one exists
Dealer.belongsTo(User, { as: "user", foreignKey: "userId" });
User.hasOne(Dealer, { as: "dealer", foreignKey: "userId" });

// Dealer application → the admin who reviewed it, and the user it produced
DealerApplication.belongsTo(User, { as: "reviewer", foreignKey: "reviewedBy" });
DealerApplication.belongsTo(User, { as: "createdUser", foreignKey: "createdUserId" });

export {
    sequelize,
    User,
    Product,
    Dealer,
    DealerApplication,
    Offer,
    Inquiry,
    Order,
    OrderItem,
    Favourite,
    PendingRegistration,
    Review,
    Conversation,
    Message,
    DailyReport,
    Setting,
};
