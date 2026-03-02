export default [
    {
        sha: 'fakesha123',
        filename: 'fake-file.js',
        status: 'added',
        additions: 10,
        deletions: 0,
        changes: 10,
        blob_url: 'http://localhost/fakeaccount/fake-repo/blob/fakecommitsha/fake-file.js',
        raw_url: 'http://localhost/fakeaccount/fake-repo/raw/fakecommitsha/fake-file.js',
        contents_url: 'http://localhost/repos/fakeaccount/fake-repo/contents/fake-file.js?ref=fakecommitsha',
        patch: '@@ -0,0 +1,10 @@\n' +
            '+Fake file content\n' +
            '+This is test data\n' +
            '+With some lines\n' +
            '+Of fake code\n' +
            '+That looks realistic\n' +
            '+But is not real\n' +
            '+Just for testing\n' +
            '+Purposes only\n' +
            '+End of file'
    }
]