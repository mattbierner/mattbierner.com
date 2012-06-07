from setuptools import setup, find_packages

setup(
    name = "mattbierner.com",
    version = "0.1.0",
    url = 'https://github.com/mattbierner/mattbierner.com'
    license = '',
    description = ""
    author = 'Matt Bierner',
    packages = find_packages('src'),
    package_dir = {'': 'src'},
    install_requires = ['setuptools'],
)
