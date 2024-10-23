"use strict";
import Express from "express";
import Product from "./Product.js";
import axios from "axios";
const googleSheetHook = new Express.Router();

const googleUpdate = async (request, response, next) => {
  try {
    const body = [
      { storeIds: [6776.0], status: "QA Error" },
      {
        status: "QA Done",
        storeIds: [7012.0, 6356.0, 6458.0, 6785.0, 6857.0, 6889.0],
      },
    ];
    console.log(JSON.parse(JSON.stringify(request.body)));
    async function getProductData(storeId) {
      const url = `https://locationscloud.com/edd-api/v2/products?product=${storeId}`;

      function extractIds(data) {
        let category_ids = [];
        let country_id = null;

        data.forEach((term, index) => {
          if (index === data.length - 1) {
            country_id = term.term_id;
          } else {
            category_ids.push(term.term_id);
          }
        });

        return { category_ids, country_id };
      }

      try {
        const response = await axios.get(url);
        if (
          response.status === 200 &&
          response.data.products &&
          response.data.products.length > 0
        ) {
          const productInfo = response.data.products[0].info;
          const pricingData = Number(response.data.products[0].pricing.amount);
          const category = response.data.products[0].info.category;
          const ids = extractIds(category);
          return { productData: productInfo, pricingData, ids };
        } else {
          console.log(`No products found for store_id ${storeId}.`);
          return { productInfo: null, pricingData: null };
        }
      } catch (err) {
        console.error(
          `Failed to fetch data from API for store_id ${storeId}:`,
          err.message
        );
        return { productInfo: null, pricingData: null };
      }
    }

    // Function to insert product data into the database
    async function insertProductIntoDb(
      category_ids,
      country_id,
      productData,
      pricingData
    ) {
      const values = {
        id: productData.id,
        slug: productData.slug,
        title: productData.title,
        create_date: productData.create_date,
        modified_date: productData.modified_date,
        status: productData.status,
        link: productData.link,
        permalink: productData.permalink,
        content: productData.content,
        excerpt: productData.excerpt,
        thumbnail: productData.thumbnail,
        price: pricingData,
        country_id: country_id,
        category_ids: JSON.stringify(category_ids),
      };

      try {
        console.log(values);
        await Product.create(values);
        console.log(
          `Product data for store_id ${productData.id} inserted successfully.`
        );
      } catch (err) {
        console.error(
          `Error inserting product data for store_id ${productData.id}:`,
          err
        );
      }
    }

    // Check if a store exists in the database
    async function checkIfStoreExists(storeId) {
      const store = await Product.findOne({ where: { id: storeId } });
      return !!store;
    }

    // Remove existing product data for a store ID
    async function removeProductFromDb(storeId) {
      try {
        const result = await Product.destroy({ where: { id: storeId } });
        if (result) {
          console.log(`Removed product data for store_id ${storeId}`);
        } else {
          console.log(`No product found for store_id ${storeId} to remove.`);
        }
      } catch (err) {
        console.error(
          `Error removing product data for store_id ${storeId}:`,
          err
        );
      }
    }

    // Process data for each store ID
    async function processStoreData(storeId) {
      const { productData, pricingData, ids } = await getProductData(storeId);

      if (!productData && !pricingData && !ids) return;
      const { category_ids, country_id } = ids;

      if (productData) {
        // Check if store already exists in DB
        const storeExists = await checkIfStoreExists(productData.id);
        if (storeExists) {
          await removeProductFromDb(productData.id); // Remove old data if exists
        }
        await insertProductIntoDb(
          category_ids,
          country_id,
          productData,
          pricingData
        ); // Insert new data
      }
    }

    // Function to sanitize storeIds (remove .0)
    function sanitizeStoreIds(storeIds) {
      return storeIds.map((storeId) => Math.floor(storeId)); // or parseInt(storeId)
    }

    // Handle QA Done store IDs: add new ones after removing old ones
    const qaDone = body.find((item) => item.status === "QA Done");
    const qaError = body.find((item) => item.status === "QA Error");

    if (qaError && qaError.storeIds) {
      // Sanitize storeIds before removing
      const sanitizedErrorStoreIds = sanitizeStoreIds(qaError.storeIds);

      // Remove QA Error storeIds from DB
      const removePromises = sanitizedErrorStoreIds.map(async (storeId) => {
        const storeExists = await checkIfStoreExists(storeId);
        if (storeExists) {
          await removeProductFromDb(storeId); // Remove if exists
        } else {
          console.log(`Store_id ${storeId} not found, nothing to remove.`);
        }
      });
      await Promise.all(removePromises);
    }

    if (qaDone && qaDone.storeIds) {
      // Sanitize storeIds before processing
      const sanitizedDoneStoreIds = sanitizeStoreIds(qaDone.storeIds);

      // Process QA Done storeIds: add them to DB after removing any existing entries
      const storeProcessingPromises = sanitizedDoneStoreIds.map((storeId) =>
        processStoreData(storeId)
      );
      await Promise.all(storeProcessingPromises);
    }

    response
      .status(200)
      .json({ message: "Product update processed successfully." });
  } catch (error) {
    console.error("Error updating product data:", error);
    response.status(500).json({ message: "Failed to update product data" });
  }
};

googleSheetHook.post("/", googleUpdate);

export { googleSheetHook };
