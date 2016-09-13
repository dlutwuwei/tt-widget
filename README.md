# widget project file genertor for i18n web

Create project directory and file for widget project

> widget project_name

## options
    -f, --force: force to cover exist directory
    -l, --local: update file in current directory path

## About commit and eslint

The project has deployed eslint and commit-validate, all commit will be check by eslint and commit-validate.

### commitizen

For unifying commit message, we use prefer [commitizen](https://www.npmjs.com/package/commitizen) to write commit message.

install:
> npm install -g commitizen

set format style:

> commitizen init cz-conventional-changelog --save-dev --save-exact --force

This command will create config in package.json and install cz-conventional-changelog auto.

use it:
> git cz

### message validate and githook

> npm install ghooks --save-dev

after install ghooks, the hooks of gerrit will be overwrite, we should revert it:

> npm run fixhook

otherwise the changeid will lost, and we can not push commit to remote.

ghooks let us run some scripts in different phase of git commit, in package.json, we can see all the config:
```json
{
    ....
    "config": {
        "ghooks": {
            "pre-commit": "npm run lint",
            ##"commit-msg": "npm run lint:msg"## no use
        },
        "validate-commit-msg": {
            "types": [
                "feat",
                "fix",
                "docs",
                "style",
                "refactor",
                "perf",
                "test",
                "chore",
                "revert"
            ],
            "warnOnFail": false,
            "maxSubjectLength": 100
        },
        "commitizen": {
            "path": "./node_modules/cz-conventional-changelog"
        }
    }
}
```
pre-commit we can run lint to check js,and when commit we can check message style.

