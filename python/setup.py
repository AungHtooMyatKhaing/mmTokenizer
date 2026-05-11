from setuptools import setup, find_packages

setup(
    name="mmTokenizer",
    version="0.1.0",
    description="Myanmar (Burmese) text syllable and word tokenizer",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="Zar Zar Hlaing",
    author_email="zarzarhlaing.it@gmail.com",
    url="https://github.com/zar-zar-hlaing/mmTokenizer",
    license="MIT",
    packages=find_packages(),
    python_requires=">=3.7",
    install_requires=[],
    classifiers=[
        "Programming Language :: Python :: 3",
        "Natural Language :: Burmese",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
