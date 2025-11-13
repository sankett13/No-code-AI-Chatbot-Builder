"use client";

import React from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import parse from "html-react-parser";

const BlogDetailsPage = () => {
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const { slug } = params;

  useEffect(() => {
    if (!slug) return;

    const fetchBlog = async () => {
      const { data, error } = await supabase
        .from("blog_summary")
        .select(
          "id, title, description, image_url, created_at, blog_details(content)"
        )
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error fetching blog:", error);
      } else {
        setBlog(data);
      }
      setLoading(false);
    };

    fetchBlog();
  }, [slug]);

  if (loading) {
    return <p className="text-center text-gray-600">Loading...</p>;
  }

  if (!blog) {
    return <p className="text-center text-gray-600">Blog not found.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <img
          src={blog.image_url}
          alt={blog.title}
          className="w-full h-64 object-cover rounded-md mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{blog.title}</h1>
        <p className="text-gray-600 mb-6">{blog.description}</p>
        <div className="prose max-w-none prose-headings:my-4 prose-p:my-2 prose-img:my-4 prose-a:text-blue-600 prose-a:underline">
          {blog.blog_details.map((detail: any, index: number) => (
            <div key={index}>{parse(detail.content)}</div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Published on {new Date(blog.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default BlogDetailsPage;
