.PHONY: help install test lint validate package clean

# Default target
help:
	@echo "Available targets:"
	@echo "  install  - Install dependencies"
	@echo "  test     - Run tests"
	@echo "  lint     - Run linter"
	@echo "  validate - Run tests and linting"
	@echo "  package  - Create distribution ZIP"
	@echo "  clean    - Remove generated files"


node_modules: package.json
	npm install

install: node_modules

test: node_modules
	npm test

lint: node_modules
	npm run lint

validate: test lint
	@echo "Validation complete"

package: validate
	npm run package

clean:
	rm -rf node_modules/
	rm -rf dist/
	rm -f *.zip
	rm -rf coverage/
	@echo "Cleaned up generated files"