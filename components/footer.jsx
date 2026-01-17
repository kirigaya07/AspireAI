import Link from 'next/link'
import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-muted/50 py-10 mt-12">
            <div className="container mx-auto text-center text-gray-400">
                <p className="text-lg font-semibold flex items-center justify-center space-x-2">
                    Made with{" "}
                    <span className="text-red-500 animate-pulse">❤️</span> by
                    <span className="font-bold text-gray-300">Author</span>
                </p>

                <div className="flex justify-center space-x-6 mt-4 text-sm">
                    <Link href="/" className="hover:text-primary transition duration-300">
                        Home
                    </Link>
                    <Link href="/about" className="hover:text-primary transition duration-300">
                        About
                    </Link>
                    <Link href="/contact" className="hover:text-primary transition duration-300">
                        Contact
                    </Link>
                    <Link href="/privacy" className="hover:text-primary transition duration-300">
                        Privacy
                    </Link>
                </div>

                <p className="text-xs text-gray-500 mt-6">
                    © {new Date().getFullYear()} Author. All rights reserved.
                </p>
            </div>
        </footer>
    )
}

export default Footer